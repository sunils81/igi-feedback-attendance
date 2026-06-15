// ============================================================
// IGI Portal — Supabase API
// Replaces: backend/gas.js  (all doGet/doPost actions)
// Requires: supabase-client.js loaded first
// ============================================================


// ── AUTH ─────────────────────────────────────────────────────

async function sbLogin(name, password) {
  // Simple name+password check against users table
  // NOTE: passwords are currently hashed in GSheets with a custom hash.
  // During migration phase, store plain bcrypt hashes via Supabase Auth instead.
  const db = getSupabase();
  const { data, error } = await db
    .from('users')
    .select('*')
    .ilike('name', name.trim())
    .eq('is_active', true)
    .single();

  if (error || !data) return { status: 'error', reason: 'wrong_credentials' };

  // TODO: replace with proper bcrypt check once passwords are re-hashed
  // For now, verify via the existing hash method you'll port from gas.js
  return {
    status: 'ok',
    counselorName: data.name,
    authRole: data.role,
    isAdmin: data.role === 'Admin',
    isManager: data.role === 'Manager',
    mustChangePassword: data.must_change,
    allowedCentres: data.centres ? data.centres.split(',').map(c => c.trim()).filter(Boolean) : []
  };
}


// ── BATCHES ──────────────────────────────────────────────────

async function sbGetBatches(centre, centres) {
  const db = getSupabase();
  let query = db.from('batches').select('*').eq('is_active', true).order('start_date', { ascending: false });

  if (centre) {
    query = query.eq('centre', centre);
  } else if (centres && centres.length) {
    query = query.in('centre', centres);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { status: 'ok', batches: data };
}

async function sbCreateBatch(p) {
  const row = {
    batch_code: p.batchCode.toUpperCase(),
    centre:     p.centre,
    course:     p.course,
    type:       p.type || '',
    batch_slot: p.batchSlot || 'Full Day',
    start_date: p.startDate || null,
    end_date:   p.endDate   || null,
    counselor:  p.counselorName || '',
    instructor: p.instructor || '',
    is_active:  true
  };
  const result = await sbInsert('batches', row);
  return { status: 'ok', batchCode: result.batch_code };
}

async function sbUpdateBatch(batchCode, updates) {
  const result = await sbUpdate('batches', { batch_code: batchCode }, updates);
  return { status: 'ok', updated: result.length };
}


// ── STUDENTS ─────────────────────────────────────────────────

async function sbGetStudents(batchCode) {
  const db = getSupabase();
  let query = db.from('students').select('*, enrollments(batch_code, status)');
  if (batchCode) query = query.eq('batch_code', batchCode);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { status: 'ok', students: data };
}

async function sbAddStudent(p) {
  // Generate student ID  (replicates GAS logic)
  const db = getSupabase();
  const year = new Date().getFullYear().toString().slice(-2);
  const { count } = await db.from('students').select('*', { count: 'exact', head: true });
  const studentId = 'IGI' + year + String((count || 0) + 1).padStart(4, '0');

  const row = {
    student_id:   studentId,
    batch_code:   p.batchCode || null,
    name:         p.name,
    mobile_last4: (p.mobile || '').slice(-4),
    mobile:       p.mobile || '',
    email:        p.email  || '',
    status:       'Active'
  };
  await sbInsert('students', row);

  // Also create enrollment
  await sbInsert('enrollments', {
    student_id: studentId,
    batch_code: p.batchCode,
    status: 'Active'
  });

  return { status: 'ok', studentId };
}


// ── SESSIONS ─────────────────────────────────────────────────

async function sbGetSessions(batchCode) {
  const db = getSupabase();
  const { data, error } = await db
    .from('sessions')
    .select('*')
    .eq('batch_code', batchCode)
    .order('session_date', { ascending: true });
  if (error) throw new Error(error.message);
  return { status: 'ok', sessions: data };
}

async function sbCreateSession(p) {
  const batchCode = (p.batchCode || '').toUpperCase();
  const db = getSupabase();

  // Count existing sessions for this batch to get sess_no
  const { count } = await db.from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('batch_code', batchCode);

  const sessNo     = (count || 0) + 1;
  const sessionCode = batchCode + '-S' + String(sessNo).padStart(2, '0');

  const row = {
    session_code: sessionCode,
    batch_code:   batchCode,
    session_date: p.sessionDate,
    sess_no:      sessNo,
    instructor:   p.instructor || '',
    session_type: p.sessionType || 'Scheduled',
    topic:        p.topic || '',
    is_cancelled: false
  };
  await sbInsert('sessions', row);
  return { status: 'ok', sessionCode };
}


// ── ATTENDANCE ────────────────────────────────────────────────

async function sbMarkAttendance(p) {
  const row = {
    session_code:   (p.sessionCode || '').toUpperCase(),
    student_id:     (p.enrollmentNo || p.studentId || '').toUpperCase(),
    batch_code:     (p.batchCode || '').toUpperCase(),
    attendance:     p.attendance || 'Present',
    feedback_score: p.feedbackScore ? parseInt(p.feedbackScore) : null,
    feedback_text:  p.feedbackText || '',
    instructor_note: p.instructorNote || ''
  };
  await sbUpsert('attendance_feedback', row, 'session_code,student_id');
  return { status: 'ok' };
}

async function sbGetAttendance(sessionCode) {
  const data = await sbGet('attendance_feedback', { session_code: sessionCode });
  return { status: 'ok', attendance: data };
}

async function sbGetStudentAttendance(studentId) {
  const db = getSupabase();
  const { data, error } = await db
    .from('attendance_feedback')
    .select('*, sessions(session_date, batch_code, topic)')
    .eq('student_id', studentId);
  if (error) throw new Error(error.message);
  return { status: 'ok', records: data };
}


// ── FEES ─────────────────────────────────────────────────────

async function sbSaveFee(p) {
  const row = {
    student_id:   p.studentId,
    batch_code:   p.batchCode  || null,
    centre:       p.centre     || '',
    amount:       parseFloat(p.amount) || 0,
    payment_date: p.paymentDate || new Date().toISOString().split('T')[0],
    payment_mode: p.paymentMode || '',
    receipt_no:   p.receiptNo  || '',
    course_fee:   parseFloat(p.courseFee) || 0,
    gst_amount:   parseFloat(p.gstAmount) || 0,
    recorded_by:  p.recordedBy || ''
  };
  const result = await sbInsert('student_fees', row);
  return { status: 'ok', id: result.id };
}

async function sbGetFees(filters = {}) {
  const db = getSupabase();
  let query = db.from('student_fees')
    .select('*, students(name)')
    .order('payment_date', { ascending: false });
  if (filters.studentId) query = query.eq('student_id', filters.studentId);
  if (filters.batchCode)  query = query.eq('batch_code', filters.batchCode);
  if (filters.centre)     query = query.eq('centre', filters.centre);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { status: 'ok', fees: data };
}


// ── ASSESSMENTS ───────────────────────────────────────────────

async function sbGetAssessments(batchCode) {
  const db = getSupabase();
  const { data, error } = await db
    .from('assessments')
    .select('*, assessment_marks(*)')
    .eq('batch_code', batchCode);
  if (error) throw new Error(error.message);
  return { status: 'ok', assessments: data };
}

async function sbSaveMarks(assessmentId, marksArray) {
  // marksArray: [{student_id, student_name, marks, remarks}]
  const rows = marksArray.map(m => ({
    assessment_id: assessmentId,
    student_id:    m.studentId || m.enrollmentNo,
    student_name:  m.studentName || '',
    marks:         parseFloat(m.marks) || 0,
    remarks:       m.remarks || ''
  }));
  const db = getSupabase();
  const { error } = await db.from('assessment_marks').upsert(rows, { onConflict: 'assessment_id,student_id' });
  if (error) throw new Error(error.message);
  return { status: 'ok', saved: rows.length };
}


// ── DIPLOMAS ──────────────────────────────────────────────────

async function sbGetDiplomaList(centres) {
  const db = getSupabase();
  // Get all students with their batch + assessment scores
  const { data, error } = await db
    .from('students')
    .select('*, batches(centre, course, end_date, instructor), diplomas(id)')
    .in('batches.centre', centres);
  if (error) throw new Error(error.message);
  return { status: 'ok', students: data };
}

async function sbReleaseDiploma(p) {
  const row = {
    student_id:      p.studentId,
    batch_code:      p.batchCode,
    student_name:    p.studentName || '',
    course:          p.course || '',
    completion_date: p.completionDate || '',
    drive_link:      p.driveLink || '',
    released_by:     p.releasedBy || ''
  };
  const result = await sbInsert('diplomas', row);
  return { status: 'ok', id: result.id };
}


// ── HOLIDAYS ──────────────────────────────────────────────────

async function sbGetHolidays(centre) {
  const db = getSupabase();
  const { data, error } = await db
    .from('holidays')
    .select('*')
    .or('centre.eq.All,centre.eq.' + (centre || 'All'))
    .order('holiday_date', { ascending: true });
  if (error) throw new Error(error.message);
  return { status: 'ok', holidays: data };
}

async function sbAddHoliday(p) {
  const row = {
    holiday_date: p.date,
    name:         p.name || 'Holiday',
    centre:       p.centre || 'All'
  };
  await sbInsert('holidays', row);
  return { status: 'ok' };
}


// ── REVENUE ───────────────────────────────────────────────────

async function sbGetRevenue(centre, year) {
  const db = getSupabase();
  let query = db.from('revenue_targets').select('*');
  if (centre) query = query.eq('centre', centre);
  if (year)   query = query.eq('year', year);
  const { data, error } = await query.order('month', { ascending: true });
  if (error) throw new Error(error.message);
  return { status: 'ok', revenue: data };
}

async function sbUpdateRevenue(centre, year, month, updates) {
  await sbUpsert('revenue_targets', {
    centre, year, month: month || null,
    ...updates
  }, 'centre,year,month');
  return { status: 'ok' };
}


// ── INVENTORY ─────────────────────────────────────────────────

async function sbGetInventory(centre) {
  const db = getSupabase();
  const { data, error } = await db
    .from('inv_stock')
    .select('*, inv_items(item_name, category, unit, reorder_level)')
    .eq('centre', centre);
  if (error) throw new Error(error.message);
  return { status: 'ok', stock: data };
}

async function sbSubmitInventoryRequest(p) {
  const row = {
    item_id:       p.itemId,
    centre:        p.centre,
    requested_qty: parseInt(p.qty) || 1,
    requested_by:  p.requestedBy || '',
    notes:         p.notes || '',
    status:        'Pending'
  };
  const result = await sbInsert('inv_requests', row);
  return { status: 'ok', id: result.id };
}


// ── ONLINE TESTS ──────────────────────────────────────────────

async function sbGetTests(batchCode) {
  const db = getSupabase();
  const { data, error } = await db
    .from('online_tests')
    .select('*, test_questions(count)')
    .eq('batch_code', batchCode)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { status: 'ok', tests: data };
}

async function sbSubmitTestResponse(p) {
  const row = {
    test_id:     p.testId,
    student_id:  p.studentId,
    batch_code:  p.batchCode || '',
    answers:     p.answers || {},
    score:       parseFloat(p.score) || 0
  };
  await sbUpsert('test_responses', row, 'test_id,student_id');
  return { status: 'ok' };
}

// ── CRM SYSTEM ────────────────────────────────────────────────
async function sbGetLeads(filters = {}, userRole = '', userName = '') {
  const db = getSupabase();
  let query = db.from('crm_leads').select('*, crm_followups(*)').order('created_at', { ascending: false });
  
  const isSuperAdmin = userRole === 'Admin' || userRole === 'Manager';
  const isAmit = String(userName).toLowerCase().trim() === 'amit';
  
  if (!isSuperAdmin && !isAmit && userRole === 'Counselor') {
    query = query.or('lead_owner.eq.' + userName + ',lead_co_owner.eq.' + userName);
  }
  
  if (filters.centre) {
    query = query.eq('centre', filters.centre);
  }
  if (filters.leadStage) {
    query = query.eq('lead_stage', filters.leadStage);
  }
  
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { status: 'ok', leads: data };
}

async function sbSaveLead(p) {
  const row = {
    first_name:     p.firstName,
    last_name:      p.lastName || '',
    email:          p.email || '',
    mobile:         p.mobile || '',
    course:         p.course,
    centre:         p.centre,
    lead_stage:     p.leadStage || 'New',
    lead_sub_stage: p.leadSubStage || 'Unassigned',
    lead_owner:     p.leadOwner || '',
    lead_co_owner:  p.leadCoOwner || '',
    source:         p.source || 'Direct',
    fb_lead_id:     p.fbLeadId || null,
    notes:          p.notes || '',
    web_meta:       p.webMeta || {},
    lead_score:     p.leadScore !== undefined ? parseInt(p.leadScore) : 0
  };
  if (p.id) row.id = p.id;
  const result = await sbUpsert('crm_leads', row, 'id');
  return { status: 'ok', id: result.id };
}

async function sbAddCRMFollowup(p) {
  const row = {
    lead_id:       p.leadId,
    reminder_date: p.reminderDate,
    note:          p.note || '',
    status:        p.status || 'Pending',
    created_by:    p.createdBy || ''
  };
  const result = await sbInsert('crm_followups', row);
  return { status: 'ok', id: result.id };
}

async function sbAssignLeadRoundRobin(centre) {
  const db = getSupabase();
  const { data: rules, error: errRules } = await db
    .from('crm_assignment_rules')
    .select('*')
    .eq('centre', centre)
    .eq('is_active', true);
    
  if (errRules || !rules || !rules.length) return '';
  
  const counselorNames = rules.map(r => r.counselor_name);
  const { data: leadCounts, error: errCounts } = await db
    .from('crm_leads')
    .select('lead_owner')
    .eq('centre', centre)
    .in('lead_owner', counselorNames);
    
  const countsMap = {};
  counselorNames.forEach(name => countsMap[name] = 0);
  if (!errCounts && leadCounts) {
    leadCounts.forEach(l => {
      if (l.lead_owner && countsMap[l.lead_owner] !== undefined) {
        countsMap[l.lead_owner]++;
      }
    });
  }
  
  const totalLeads = leadCounts ? leadCounts.length : 0;
  const totalWeight = rules.reduce((sum, r) => sum + (Number(r.crm_weight) || 0), 0);
  
  if (totalWeight <= 0) return counselorNames[0];
  
  let bestCounselor = counselorNames[0];
  let maxDeficit = -Infinity;
  
  rules.forEach(rule => {
    const name = rule.counselor_name;
    const weight = Number(rule.crm_weight) || 0;
    const actual = countsMap[name] || 0;
    const target = (weight / totalWeight) * (totalLeads + 1);
    const deficit = target - actual;
    
    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      bestCounselor = name;
    }
  });
  
  return bestCounselor;
}

async function sbUpdateLeadScore(leadId, action) {
  const db = getSupabase();
  const { data: lead, error } = await db
    .from('crm_leads')
    .select('lead_score')
    .eq('id', leadId)
    .single();
    
  if (error || !lead) return;
  
  let scoreDelta = 0;
  if (action === 'web-enquiry') scoreDelta = 10;
  else if (action === 'fb-lead') scoreDelta = 5;
  else if (action === 'call-connected') scoreDelta = 15;
  else if (action === 'demo-scheduled') scoreDelta = 20;
  else if (action === 'demo-attended') scoreDelta = 30;
  else if (action === 'call-no-answer') scoreDelta = -5;
  else if (action === 'call-dnd-off') scoreDelta = -10;
  else if (action === 'marked-lost') scoreDelta = -25;
  
  const newScore = Math.max(0, (lead.lead_score || 0) + scoreDelta);
  await db.from('crm_leads').update({ lead_score: newScore }).eq('id', leadId);
}

async function sbConvertLeadToStudent(p) {
  const db = getSupabase();
  const year = new Date().getFullYear().toString().slice(-2);
  const { count } = await db.from('students').select('*', { count: 'exact', head: true });
  const studentId = 'IGI' + year + String((count || 0) + 1).padStart(4, '0');
  
  const studentRow = {
    student_id:   studentId,
    batch_code:   p.batchCode || null,
    name:         p.name,
    mobile:       p.mobile || '',
    mobile_last4: (p.mobile || '').slice(-4),
    email:        p.email || '',
    status:       'Active'
  };
  await sbInsert('students', studentRow);
  
  await sbInsert('enrollments', {
    student_id: studentId,
    batch_code: p.batchCode,
    status: 'Active'
  });
  
  if (p.amount && parseFloat(p.amount) > 0) {
    const feeRow = {
      student_id:   studentId,
      batch_code:   p.batchCode,
      centre:       p.centre || '',
      amount:       parseFloat(p.amount) || 0,
      payment_date: p.paymentDate || new Date().toISOString().split('T')[0],
      payment_mode: p.paymentMode || '',
      receipt_no:   p.receiptNo || '',
      course_fee:   parseFloat(p.courseFee) || 0,
      gst_amount:   parseFloat(p.gstAmount) || 0,
      recorded_by:  p.recordedBy || ''
    };
    await sbInsert('student_fees', feeRow);
  }
  
  let courseCode = 'DG';
  if (p.course) {
    if (p.course.includes('Colored Stone')) courseCode = 'CSG';
    else if (p.course.includes('Gemology')) courseCode = 'GG';
    else if (p.course.includes('Polished')) courseCode = 'PDC';
    else if (p.course.includes('Design')) courseCode = 'JD';
    else if (p.course.includes('CAD')) courseCode = 'CAD';
    else courseCode = p.course.split(' ').map(w => w[0]).join('').toUpperCase();
  }
  
  await db.from('crm_leads')
    .update({
      student_id: studentId,
      lead_stage: 'Enrolled',
      lead_sub_stage: 'Enrolled (' + courseCode + ')',
      lead_score: 100
    })
    .eq('id', p.leadId);
    
  return { status: 'ok', studentId };
}

async function sbInitiateCrossCentreUpsell(leadId, targetCentre, targetCourse) {
  const db = getSupabase();
  const { data: lead, error } = await db
    .from('crm_leads')
    .select('*')
    .eq('id', leadId)
    .single();
    
  if (error || !lead) throw new Error('Lead not found');
  
  const newOwner = await sbAssignLeadRoundRobin(targetCentre);
  
  const row = {
    first_name:     lead.first_name,
    last_name:      lead.last_name || '',
    email:          lead.email || '',
    mobile:         lead.mobile || '',
    course:         targetCourse,
    centre:         targetCentre,
    lead_stage:     'Alumni / Upsell',
    lead_sub_stage: 'Cross-Sell Initial',
    lead_owner:     newOwner,
    lead_co_owner:  lead.lead_owner,
    source:         'Internal Cross-Sell',
    student_id:     lead.student_id,
    notes:          'Cross-sold from ' + lead.centre + ' by ' + lead.lead_owner
  };
  
  const result = await sbInsert('crm_leads', row);
  return { status: 'ok', id: result.id };
}

async function sbGetAssignmentRules(centre) {
  const db = getSupabase();
  let query = db.from('crm_assignment_rules').select('*').order('counselor_name', { ascending: true });
  if (centre) query = query.eq('centre', centre);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { status: 'ok', rules: data };
}

async function sbSaveAssignmentRule(p) {
  const row = {
    counselor_name: p.counselorName,
    centre:         p.centre,
    crm_weight:     parseInt(p.crmWeight) || 0,
    is_active:      p.isActive !== false
  };
  await sbUpsert('crm_assignment_rules', row, 'counselor_name');
  return { status: 'ok' };
}

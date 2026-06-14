# CSV Export & Import Order

Import in THIS order (foreign keys require parent tables first).

## Step 1 — Export from Google Sheets
For each sheet below: open GSheet tab → File → Download → CSV

## Step 2 — Import to Supabase
Table Editor → click table name → Import data → Upload CSV

---

## ORDER TO IMPORT

| # | GSheet Tab Name       | Supabase Table       | Notes |
|---|-----------------------|----------------------|-------|
| 1 | User_Credentials      | users                | Skip password_hash/salt for now — reset passwords after |
| 2 | Batches               | batches              | Core table — must be first |
| 3 | Batch_Students        | students             | Depends on batches |
| 4 | Student_Batches       | enrollments          | Depends on students + batches |
| 5 | Sessions              | sessions             | Depends on batches |
| 6 | Holidays              | holidays             | No dependencies |
| 7 | Attendance_Feedback   | attendance_feedback  | Depends on sessions + students |
| 8 | ATT_Records           | att_records          | Depends on batches + students |
| 9 | Assessments           | assessments          | Depends on batches |
| 10| Assessment_Marks      | assessment_marks     | Depends on assessments + students |
| 11| Student_Fees          | student_fees         | Depends on students + batches |
| 12| Diplomas              | diplomas             | Depends on students + batches |
| 13| HOD_Approvals         | hod_approvals        | No dependencies |
| 14| Revenue_Targets       | revenue_targets      | Merge all 4 Revenue sheets into one |
| 15| INV_Items             | inv_items            | Inventory master |
| 16| INV_Stock             | inv_stock            | Depends on inv_items |
| 17| INV_Requests          | inv_requests         | Depends on inv_items |
| 18| INV_Dispatch          | inv_dispatch         | Depends on inv_requests |
| 19| INV_Vendors           | inv_vendors          | No dependencies |
| 20| QuestionBank          | question_bank        | Online test questions |
| 21| OnlineTests           | online_tests         | Depends on batches |
| 22| OT_Questions          | test_questions       | Depends on online_tests + question_bank |
| 23| OT_Responses          | test_responses       | Depends on online_tests + students |
| 24| OT_ManualGrades       | manual_grades        | Depends on test_responses |
| 25| OT_Warnings           | test_warnings        | Depends on online_tests + students |
| 26| OT_Starts             | test_starts          | Depends on online_tests + students |

---

## Column Mapping — Key Tables

### Batches sheet → batches table
| Sheet Column | Table Column |
|---|---|
| Col A (batchCode) | batch_code |
| Col B (centre) | centre |
| Col C (course) | course |
| Col D (type) | type |
| Col E (batchSlot) | batch_slot |
| Col F (startDate) | start_date |
| Col G (endDate) | end_date |
| Col H (counselorName) | counselor |
| Col J (instructor) | instructor |

### Batch_Students sheet → students table
| Sheet Column | Table Column |
|---|---|
| Col A (studentId) | student_id |
| Col B (batchCode) | batch_code |
| Col C (name) | name |
| Col D (mobileLast4) | mobile_last4 |
| Col E (mobile) | mobile |
| Col F (email) | email |
| Col G (status) | status |

### Sessions sheet → sessions table
| Sheet Column | Table Column |
|---|---|
| Col A (sessionCode) | session_code |
| Col B (batchCode) | batch_code |
| Col C (sessionDate) | session_date |
| Col D (sessNo) | sess_no |
| Col E (instructor) | instructor |
| Col F (sessionType) | session_type |
| Col G (topic) | topic |

---

## Tips
- Dates: Supabase expects YYYY-MM-DD format. If your GSheet has DD/MM/YYYY, use Find & Replace or a formula to convert before exporting.
- Boolean columns: Supabase accepts TRUE/FALSE or 1/0. GSheet uses Y/N — replace Y→true and N→false before export.
- Skip empty rows at top (header row will be auto-detected).

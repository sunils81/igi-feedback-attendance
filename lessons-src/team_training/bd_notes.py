#!/usr/bin/env python3
"""Adds presenter notes (<aside class="notes">) to every scene of decks/igi-team-bd-pitch/scenes.html.
Re-running replaces the notes. Cue tags: <span class="cue">[CLICK]</span>; "If asked" lines: <span class="ifask">."""
import os, re, sys
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'decks', 'igi-team-bd-pitch', 'scenes.html')
C = lambda t: f'<span class="cue">[{t}]</span>'
IF = lambda t: f'<span class="ifask">If asked: {t}</span>'

N = {
'hero': f'''<p><b>About 45 seconds.</b> Welcome everyone. Thank Lata and Dinesh for giving us the slot.</p>
<p>"You meet jewelers every single day. Many of them have a problem we can solve, and you are the person standing in front of them. In the next twenty minutes I want you to leave knowing two programs well enough to pitch them in one breath."</p>
<p>"There are only two things to remember: <b>Retail Technical &amp; Sales Training</b> for retailers with a sales team, and the <b>LGD Business Masterclass</b> for people starting a lab-grown business."</p>
<p>{C("ASK THE ROOM")} "Hands up: who has been asked by a retailer in the last month whether IGI does training?" Note the hands; it tells you how much awareness already exists.</p>''',

'two': f'''<p><b>About 1.5 minutes.</b> This is the whole briefing on one slide. If they remember nothing else, they remember this split.</p>
<p>{C("CLICK")} <b>An existing retailer.</b> "If the person has stores and a sales team, the conversation is about their associates. Can their people explain a diamond, a lab-grown stone, a ruby, with confidence? If not, that is RTT. Price: two thousand five hundred rupees per associate, per day."</p>
<p>{C("CLICK")} <b>Someone entering lab-grown.</b> "If the person says 'I'm thinking of starting a lab-grown brand' or 'we want to add a lab-grown line', that is the Masterclass. Three online mornings in December, one thousand US dollars."</p>
<p>"One question decides it: <b>do they already sell to customers through a team, or are they planning a business?</b> Sometimes it is both, and we will see that in the practice round."</p>
{IF("Can a retailer's staff join the Masterclass? Yes, but it is built for owners and decision-makers. For staff, RTT is the right fit.")}''',

'ch1': f'''<p><b>About 20 seconds.</b> Transition. "Let's start with RTT: what the retailer actually buys."</p>
<p>Read the line on screen slowly: <b>"The associate is the last voice between the customer and the brand. We make it an expert one."</b> This is the line to repeat to owners.</p>''',

'rtt-what': f'''<p><b>About 2 minutes.</b> Explain the product simply: two halves, three tracks.</p>
<p>{C("CLICK")} <b>Technical, about 60%.</b> "This is the gemology made practical for the counter: the 4Cs, how to tell natural from lab-grown and disclose it properly, how to read and verify an IGI report, how to show a stone under the right light with a loupe."</p>
<p>{C("CLICK")} <b>Sales, about 40%.</b> "Knowledge alone doesn't sell. The sales half turns grades into benefits the customer can feel, handles the hard questions like 'Is lab-grown real?', and covers closing, add-ons and clienteling."</p>
<p>{C("CLICK")} {C("CLICK")} {C("CLICK")} <b>The three tracks.</b> Natural, Lab-Grown, Colored Stones. "IGI is one of the few labs that grades all three, so we can train all three."</p>
<p>Point to the tip: diamond jewelry is covered in every track, and the training is shaped around the retailer's own collections. <b>That customization is a selling point; say it every time.</b></p>
{IF("Can the split change? Yes. A retailer can ask for more sales or more technical; Sunil shapes the day.")}
{IF("Do they need all three tracks? No. Most choose one or two. Combine them for stores that sell side by side.")}''',

'rtt-case': f'''<p><b>About 2 minutes.</b> Owners buy results, not training. These are the numbers to quote.</p>
<p><b>The chart:</b> "A Wharton and INSEAD study followed 63,500 sales associates in 330 stores for two years. Associates who completed just one training module sold 69% more. Those who completed six or more sold 123% more." Pause on the tallest bar.</p>
<p>{C("CLICK")} <b>Lead with our own result:</b> "After an IGI retail training at one of India's leading national jewelry chains, ROI jumped 11% the week after." This is Indian, it is ours, and it is the strongest line we have.</p>
<p>{C("CLICK")} "Customers still want a person: 69% of jewelry shoppers seek a sales associate's help in store."</p>
<p>{C("CLICK")} "And the cost of untrained staff: 85% would leave a store if the staff don't understand the product."</p>
<p>Read the tip: we already train <b>Tanishq, CaratLane, GIVA and Jewelbox</b>. "You can name them in conversation. They are not printed in the brochure, so say them, don't send them in writing."</p>
{IF("Where is the 11% from? An IGI client result. Sunil can share details with a serious prospect; don't name the chain.")}
{IF("Are the other studies Indian? No, they are US and UK. Say so honestly; the 11% is the Indian proof.")}''',

'rtt-how': f'''<p><b>About 1 minute 45.</b> How it runs and what it costs.</p>
<p>{C("CLICK")} <b>In person:</b> at their store, training center or any venue, hands-on with loupes, stones and live IGI reports. A full day is about six hours.</p>
<p>{C("CLICK")} <b>Online:</b> live and instructor-led, in shorter modules for teams spread across cities.</p>
<p>{C("CLICK")} {C("CLICK")} {C("CLICK")} {C("CLICK")} <b>It is measured.</b> "This is what owners love: a baseline test before, live quizzes on phones during the day, a final test after, and then an IGI certificate for each associate plus a results report for the manager. The owner sees the improvement."</p>
<p>Then the price: <b>"Two thousand five hundred rupees per associate, per day."</b> Quote it as the starting point. Sunil confirms the final proposal once he knows team size, track and format.</p>
{C("PAUSE")}
{IF("Is GST extra? Don't commit on the spot; Sunil confirms the final quote.")}
{IF("Is there a minimum batch size? Pass the question to Sunil with the team size; he will confirm.")}
{IF("Do associates get a diploma? No, an IGI certificate. Diplomas are only for IGI's full courses.")}''',

'rtt-pitch': f'''<p><b>About 2 minutes.</b> The most practical slide. Ask before you pitch.</p>
<p><b>Best targets:</b> owners and directors (they sign), retailers opening new stores, chains launching lab-grown or colored stones, and any store with high staff turnover.</p>
<p>{C("CLICK")} for each question, and explain why it matters:</p>
<p>1. <b>Associates and new joiners:</b> gives the team size for the quote, and new joiners mean a training gap.</p>
<p>2. <b>What customers ask about lab-grown:</b> if the answer is vague, they need disclosure training.</p>
<p>3. <b>Can every associate read an IGI report?</b> Almost always "not everyone": that is the opening.</p>
<p>4. <b>Where they lose sales:</b> conversion or average ticket problems are exactly what the sales half fixes.</p>
<p>5. <b>New stores or categories:</b> train before opening, not after.</p>
<p>{C("CLICK")} <b>The pitch in one breath.</b> Read it aloud once, slowly. Then {C("ACTIVITY")} ask one volunteer to say it in their own words in 20 seconds.</p>
{IF("What if the owner isn't in the meeting? Get the store manager's view, then ask for 10 minutes with the owner, or pass the lead to Sunil to approach the owner.")}''',

'rtt-obj': f'''<p><b>About 2 minutes.</b> {C("ASK THE ROOM")} Read each objection aloud and ask the room how they would answer <b>before</b> you click the card.</p>
<p><b>"We train our staff in-house."</b> Agree, then add: we bring what only a grading lab can, plus tests that prove the improvement.</p>
<p><b>"Trained staff will just leave."</b> The IGI certificate and levels (Associate → Specialist → Advisor → IGI Certified Advisor) give pride and a reason to stay. Untrained staff cost sales every day.</p>
<p><b>"We don't have the budget."</b> Do the maths with them: ₹2,500 per associate. One extra diamond sale a month covers the whole team. Offer a one-store pilot.</p>
<p><b>"We can't close the store for a day."</b> Online modules, or training in batches so the floor stays covered.</p>
<p>Finish with the tip: <b>never argue; agree, then add.</b> If they still hesitate, propose the pilot and pass the lead to Sunil.</p>''',

'ch2': f'''<p><b>About 20 seconds.</b> Transition. "Now the second program, for a different person entirely."</p>
<p>"The trigger sentence is: <b>'I want to start a lab-grown brand.'</b> Or: 'We're thinking of adding lab-grown.' When you hear it, that is a Masterclass lead."</p>''',

'lgd-why': f'''<p><b>About 1 minute 45.</b> The story to tell anyone curious about lab-grown.</p>
<p><b>The chart:</b> "In 2022 India exported about 27 million carats of natural diamonds and under 4 million of lab-grown. By 2025, lab-grown had reached 15 million carats, almost level with natural."</p>
<p>{C("CLICK")} "That's four times growth in three years."</p>
<p>{C("CLICK")} "India is the world's leading exporter of lab-grown diamonds, about 36% of the global total."</p>
<p>{C("CLICK")} "And the Indian market itself is only starting: lab-grown jewelry in India is forecast to grow from about 0.4 billion dollars in 2025 to just over 1 billion by 2032."</p>
<p>{C("CLICK")} "In some Indian cities, 8 to 10% of diamond jewelry sales are already lab-grown."</p>
<p>The message: <b>the opportunity is real and early. People who plan properly now will win.</b></p>
{IF("Aren't lab-grown prices falling? Yes, stone prices have fallen. That is why the business model and pricing matter, and Module 3 of the Masterclass covers exactly that.")}''',

'lgd-what': f'''<p><b>About 1.5 minutes.</b> What a participant gets.</p>
<p>{C("CLICK")} <b>1 · Find your customer:</b> who buys lab-grown in India today, from metro professionals to first-time buyers.</p>
<p>{C("CLICK")} <b>2 · Shape your collection:</b> stones, settings, metals; from first sketch to a collection that sells.</p>
<p>{C("CLICK")} <b>3 · Pricing and business model:</b> source it, make it, certify it, with interactive calculators.</p>
<p>{C("CLICK")} <b>4 · Brand and launch:</b> merchandising, marketing and selling with full disclosure, ending with their own launch roadmap.</p>
<p>The facts to memorize: <b>December 9 to 11, 2026 · 9:30 to 12:30 IST · live online · 14 modules, 9 worksheets · IGI certificate of completion · US$1,000 · seats limited.</b></p>
{IF("Is it recorded? It is live and interactive; ask Sunil about recordings.")}
{IF("Can they pay in rupees? Pass to Sunil for invoicing.")}
{IF("Will there be another date? Possibly; collect the name and pass it on.")}''',

'lgd-pitch': f'''<p><b>About 1 minute 45.</b> Who to target and the pitch.</p>
<p>{C("CLICK")} <b>Best targets:</b> entrepreneurs launching a lab-grown brand; family jewelers adding lab-grown next to natural and gold; manufacturers and exporters moving into finished jewelry; online sellers and designers.</p>
<p>{C("CLICK")} Read the pitch aloud once.</p>
<p>Then the three objections; {C("ASK THE ROOM")} before each flip:</p>
<p><b>"I'll learn it on the job."</b> A wrong price or a weak first collection costs far more than US$1,000.</p>
<p><b>"Lab-grown prices keep falling."</b> Exactly why they need a pricing model that still works; Module 3.</p>
<p><b>"I can't spare three days."</b> Three mornings, online, from anywhere; afternoons free.</p>''',

'match': f'''<p><b>About 2 minutes</b> (cut to three cards if short of time). {C("ACTIVITY")}</p>
<p>Read a scenario aloud, let the room shout "RTT" or "Masterclass", then click to check.</p>
<p><b>A · 12-store chain adding lab-grown counters:</b> RTT, Lab-Grown track, before launch.</p>
<p><b>B · Manufacturer's son starting a brand:</b> Masterclass.</p>
<p><b>C · Staff can't explain why a stone costs more:</b> RTT, Natural track, full 60/40.</p>
<p><b>D · Family jeweler curious about lab-grown:</b> <b>both</b>. Owner takes the Masterclass; team takes RTT. This is the best kind of lead: point it out.</p>
<p><b>E · Ruby and emerald collection launch:</b> RTT, Colored Stones track.</p>
<p><b>F · Instagram seller building a collection:</b> Masterclass.</p>''',

'quiz': f'''<p><b>About 1.5 minutes</b> (optional if time is short). Six quick questions. Let the room call out answers; click the most popular one.</p>
<p>Answers: ₹2,500 per associate per day · 60/40 · Natural, Lab-Grown, Colored Stones · Dec 9–11 online · Masterclass for a new brand · leads to sunil.sharma@igi.org.</p>''',

'lead': f'''<p><b>About 1 minute.</b> The hand-off. Keep it simple.</p>
<p>{C("CLICK")} <b>Qualify</b> with the five questions: note the track, team size and number of stores.</p>
<p>{C("CLICK")} <b>Share the brochure:</b> RTT brochure for retailers; Masterclass brochure for new entrants. Both are with Lata and Dinesh.</p>
<p>{C("CLICK")} <b>Email Sunil:</b> name, company, city, contact number, which program, and what they told you.</p>
<p>{C("CLICK")} <b>We follow up</b> with the proposal or registration and keep you copied, so you can track your lead.</p>
{IF("How is the BD team credited? Agree this with Lata and Dinesh; don't promise anything on the spot.")}''',

'end': f'''<p><b>About 30 seconds.</b> Close with energy.</p>
<p>"Every retailer you meet is a lead. Retailer with a sales team: RTT. Someone starting in lab-grown: the Masterclass. Not sure? Ask the five questions and email me."</p>
<p>Thank everyone. Invite one question. Remind them the brochures are with Lata and Dinesh.</p>''',
}

s = open(P, encoding='utf-8').read()
s = re.sub(r'\s*<aside class="notes">.*?</aside>', '', s, flags=re.S)
missing = []
for key, html in N.items():
    sid = 's-' + key
    m = re.search(r'<section[^>]*\bid="%s"' % re.escape(sid), s)
    if not m:
        missing.append(sid); continue
    end = s.index('</section>', m.end())
    s = s[:end] + '  <aside class="notes">' + html + '</aside>\n' + s[end:]
ids = re.findall(r'<section[^>]*\bid="(s-[^"]+)"', s)
nonotes = [i for i in ids if i[2:] not in N]
open(P, 'w', encoding='utf-8').write(s)
print('notes on', len(N), 'scenes; missing scenes:', missing, '; scenes without notes:', nonotes)

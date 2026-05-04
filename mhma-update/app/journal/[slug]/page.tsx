"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";

interface JournalEntry {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  slug: string;
  acf?: {
    journal_title?: string;
    date_published?: string;
    date_held_on?: string;
    attendees?: string;
    content?: string;
  };
}

const journalContent: Record<string, { title: string; content: string; date: string; attendees: string; data?: any; isImage?: boolean; imageUrl?: string }> = {
  "bod-minutes-for-mhma-board-of-directors-meeting-12-apr-26": {
    title: "BOD Minutes for MHMA Board of Directors Meeting – 12-Apr-26",
    date: "April 18, 2026",
    attendees: "Umar Sear, Asad Siddiqui, Saqib Malik, Mohamed Basha, Sarfaraz Shaikh",
    content: `The MHMA board of directors meeting was held on 12-Apr-26. The following meeting minutes were recorded:

**MINUTES**

**Date:** 12-Apr-2026
**Location:** Unit Center

**Board Attendees:**
Asad Siddiqui, Saqib Malik, Sarfaraz Shaikh, Umar Sear, Mohammad Waqas

**Did not attend:** Mohamed Mohamed, Sadia Khan, Oussama S

**Agenda**

**MHMA Committees Policy Review**
Discussed comments/suggestions from BODs, made edits to the document where needed. There are a couple of comments still open to be discussed in the next BOD meeting.

**MHMA Reinstatement Update**
The review of 1023 is in final state. Last step to clarify a question on Grants that were identified on the financial docs. Saqib following up with Tax consultant.

**MHMA Welcoming Summer Picnic (May 16)**
Combine MHMA Welcome Summer Picnic with other MHMA program – MHMA Day proposed by Hidaya Committee. We also discussed the other MHMA Picnic that happens in Sept/October where BBQ is done by Boy Scouts Troop and will continue that.

**Montessori Program**
Asad S noted that this program is out of compliance. There was no formal BOD approval for starting this program and there are no details provided for operational and governance purposes. We have to revisit this and do a formal review, ensure all documentation is in place and a shared understanding of the arrangements. Previous board meeting notes were shared, and it was noted that Education committee will discuss and come back with a proposal. Umar S had a different recollection where it was noted that an approval was obtained.

**Arafah Iftaar**
Agreed to have a structured community iftaar communication regarding this. Last time it was informal and not many people from community joined for iftaar.

**Eid Al Adha Planning**
Things to consider – Finals Weeks for MHHS; Graduation for Middle school and Weekday. Decision made to have petting zoo, face painting, jumpers, magic show etc. Lead to execute Eid end-end: Waqas.

**Robotics & Lego Competition**
Discussed that this will be scheduled 2nd week of May. Waqas to look at calendar availability and propose a date/time and coordinate the event.

**AI Trainings Request for UC**
Umar S & Mohamed are conducted AI trainings in a personal capacity and wanted to discuss using UC. Some proceeds from the program will be donated to MHMA. Did not discuss in detail as we did not have a quorum for this to make a decision.

**Al-Hayy request**
Update from Umar S → The UC availability for these times and dates is tentative as City is looking to book the UC during summer and as a result we are moving around our schedule for Maktab. We will know more closer to last week of May or early June but as of now consider it unavailable and plan accordingly.`,
    data: {
      membership: { current: 210, previous: 210 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "bod-minutes-for-mhma-board-of-directors-meeting-05-apr-26": {
    title: "BOD Minutes for MHMA Board of Directors Meeting – 05-Apr-26",
    date: "April 12, 2026",
    attendees: "Umar Sear, Asad Siddiqui, Saqib Malik, Mohamed Mohamed, Sarfaraz Shaikh",
    content: `The MHMA board of directors meeting was held on 05-Apr-26. The following meeting minutes were recorded:

**MINUTES**

**Board Attendees:** Asad Siddiqui, Saqib Malik, Sarfaraz Shaikh, Umar Sear, Mohammad Waqas, Mohamed Mohamed

**Did not attend:** Mohammad Basha, Oussama S, Sadia Khan

**Agenda**

**Welcoming @Waqas**
Meeting Timing: Discussed various days/times. Agreed to try 9am Sundays moving forward. We will work towards wrapping up in an hr.

**Finance Update – Month Ending March'26**
BODs discussed some updates to the financial update layout. Suggestion for some changes to the layout for clarity.

**Resolution/Voting – move Jumma collections to Operations Account and Property Tax payments to be done from Masjid Donation Accounts:** BODs present voted unanimously to operationalize this change. Avg $1200 as Jumma collection.

**Suggestion on Budgets for Programs.** We previously discussed this as a Board and while we decided not to have budget, we have deep-dived into our large recurring spend – Maktab, WISH, etc. We agreed to explore budgeting but will not enforce if someone is going above for reasons that are justified.

**Compliance Documents and Applicability to MHMA**
- **MHMA 990 – Tax Returns:** Not done, This must be sent alongside 1023. Umar bhai reviewed 1023 updates from attorney and responded to Barbara. Shared updates on voting members (~500 vs 200).
- Asad S reviewed 990 tax form prepared by United Tax and discussed findings with Saqid & Umar. Inaccuracies will be discussed with UT and updates made accordingly.
- **1099-NEC:** Issued 1099 to two people (Sh Saad and Sh Fawaz). Need to get info from Sh Tamim. Analysis on how many people are we paying cumulative >$600 (if paid multiple times through the year). Sh Zaid Shakir gave details to process his fee as 1099. Also get guidance from United Tax + Legal.
- **Property Tax:** Apr 10th is due date – We paid already – $22,349.73.
- **Tax Returns for Siraj Center:** 990 postcard was filed. Need to file Forms 3500a and 199 are CA – deadline is July.
- **990 – T —- Moneys that can be considered as Income (no-charitable, non-religious, etc):** Need to investigate how do we handle this, how, if at all, this should be reflected in 990 Tax Returns.
- **RRF-1 or CT-1- CA AG (Annual):** We do not have this and we will start this application. Forms 3500a and 199 are CA. Asad S to get guidance from Barbara.

**MHMA Committee Policy Review**
BODs will read policy and be prepared to discuss on Sun 4/12.

**Action:**
Property Tax Address needs to be change to 250 E Main @Asad S`,
    data: {
      membership: { current: 210, previous: 210 },
      accounts: {
        operations: { current: "$38,964.44", previous: "$51,918.08" },
        membership: { current: "$35,577.85", previous: "$39,291.94" },
        masjid: { current: "$260,117.13", previous: "$63,660.91" },
        zakat: { current: "$14,265.50", previous: "$19,505.03" }
      }
    }
  },
  "minutes-for-mhma-full-board-meeting-30-mar-26": {
    title: "Minutes for MHMA Full Board Meeting – 30-Mar-26",
    date: "April 5, 2026",
    attendees: "Asad Jafri, Asad Siddiqui, Faisal Shahid, Kanishka Ramyar, Mohamed Basha, Mohamed Mohamed, Oussama Saafien, Owais Khalid, Sadia Khan, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Tarik Khan, Umar Sear, Zafar Khan",
    content: `The MHMA board meeting was held on 30-Mar-26. The following meeting minutes were recorded:

**MINUTES**

**Agenda & Minutes**

**MHMA Board Meeting Schedule**
Meeting calendar was published. Finalized board meeting schedule for full board as well as BODs. When needed we will discuss and arrange adhoc full board meeting based on discussion topics and urgency on decision making. We also agreed that we will take a poll on timing ahead of meetings to ensure the date and time works for majority.

**MHMA Reinstatement update**
Umar S Update: Things are moving forward. Were blocked a few actions from accounting firm. They have been very thorough – we have the info we need from them. 1023 has been completed and submitted to Barbara. Attorney(Barbara) has reviewed and shared updates. Core team has to review her updates and provide a response along with financials.

**Construction Next Steps & update**
Spoken to couple of folks to get leads on Architects, civil engineers; leaning towards Tauheed bhai (from Brentwood) to prepare and submit the package to city of MH. Hired woodrodgers for surveys. Target: 3-4 months (End of July) to have the package ready for submission to city. What is our concern with Tauheed? He is a GC, the conversations so far, has been he is proposing to change designs whereas we have all aligned on designs based on our community needs. He is opiniated but also has good suggestions.

**Sub-Division:** The paperwork for recording sub-division has been submitted to City. The city has submitted this to the county. The turnaround from County is 4 weeks – next update is end of April. Also exploring a firm from Chicago, suggested by Asif Alvi. Folsom is also using someone in Chicago. Decision to be made by end of this coming week – April 3rd.

**Action:** Provide an update on construction every Friday.

**Property Tax update**
Submitted the paperwork to appeal on their determination. They noted that they will not give us full 7 acre but more than the 2 acre they have already approved. Updates to the land – flatten out and plan to start parking there.

**Website needs to update with all MHMA programs, pictures, etc.**
Trying to get 4 containers – connected, fully finished with necessary HVAC. We will have to have permits from the City because containers will have occupancy. Once we have a sense of close-to-final pricing, we should explore next steps. Suggestion is to have the discussions with City on these temp classrooms along with the renewal discussion of UC.

**MHMA Committee Policy Follow up**
Agreed to have a separate dedicated meeting for BODs to discuss and finalize.

**UC booking management challenges**
City meetings conflicting with MHMA program (Maktab). Everyone should get access to mhma95391@gmail.com to view the most up to date calendar on events and programs that block UC. If there is a City placeholder and City blocks over MHMA program, Umar S will discuss and mediate with City to move if possible.

**MHMA Website (main source of info for community)**
Offline discussion with Br Kanishka.

**Two-day pre-school program (Sr Musarrat Proposal)**
Sr Musarat spoke to Oussama with a proposal for pre-school for ages 3-5 timing 9-11am or 9:30-11:30am. This program will be run under MHMA. Next Steps/Action: Discuss this part of education committee and come back with a proposal to BODs.

**Faisal Shahid Resignation**
Cited personal reasons and commitments for resigning. BODs accepted resignation and thanked him for his services and sacrifices for community. BODs were presented with an option to pick from for the vacant position – Mohammad Waqas's name was shared by Faisal as a potential candidate. BODs unanimously voted to bring Waqas onboard if he is willing to take on the role and has the time and capacity to support BODs.`,
    data: {
      membership: { current: 210, previous: 210 },
      accounts: {
        operations: { current: "$38,964.44", previous: "$51,918.08" },
        membership: { current: "$35,577.85", previous: "$39,291.94" },
        masjid: { current: "$260,117.13", previous: "$63,660.91" },
        zakat: { current: "$14,265.50", previous: "$19,505.03" }
      }
    }
  },
  "minutes-for-mhma-full-board-meeting-ramadan-fr-focus-24-feb-26": {
    title: "Minutes for MHMA Full Board Meeting – Ramadan FR Focus – 24-Feb-26",
    date: "March 25, 2026",
    attendees: "Asad Jafri, Asad Siddiqui, Kanishka Ramyar, Saqib Malik",
    content: `The MHMA board meeting was held on 24-Feb-26. The following meeting minutes were recorded:

**MINUTES**

**Agenda Topic**

**Fundraiser Plan**
Everyone in alignment to do another FR on Kahtam night. Voting was conducted virtually with the board.

**Board member that voted yes:** Asad Siddiqui, Nazeer Shaik, Tarik Khan, Owais Khalid, Sarfara Shaik, Mohammad Basha, Saqib Malik, Sadia Khan, Kanishka.

**Board members that voted no:** None

We will continue where we left off, target $1M, pledged so far $464K.

**FR Speaker –** Sh. Tamim or Sh Yasir.`,
    data: {
      membership: { current: 208, previous: 208 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "minutes-for-mhma-full-board-meeting-18-jan-26": {
    title: "Minutes for MHMA Full Board Meeting – 18-Jan-26",
    date: "January 25, 2026",
    attendees: "Asad Jafri, Asad Siddiqui, Faisal Shahid, Kanishka Ramyar, Mohamed Basha, Mohamed Mohamed, Nazeer Shaik, Oussama Saafien, Owais Khalid, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Umar Sear, Zafar Khan",
    content: `The MHMA board meeting was held on 18-Jan-26. The following meeting minutes were recorded:

**MINUTES**

**Agenda & Minutes**

**Construction Update**
Continued discussions on construction timeline and vendor selection. Reviewed progress with survey work and city approvals.

**MHMA Non-Profit Status Update**
Reviewed reinstatement process with attorney Barbara. 1023 form completed pending submission. Tax returns for 2022-2023 being prepared.

**Property Tax Update**
Continued work on property tax exemption for the 7-acre land. 2 acres approved retroactively, working on documentation for remaining 5 acres.

**Ramadan Planning**
Initial planning discussions for Ramadan 2026. Committee formation and logistics being organized.

**Fundraising Update**
Reviewed fundraising targets and strategies for Masjid construction. Current focus on major donor engagement.

**Action Items:**
- Complete 1023 submission @Umar S
- Follow up on property tax exemption documentation @Asad S
- Begin Ramadan committee formation @Saqib M
- Update construction timeline @Umar S`,
    data: {
      membership: { current: 210, previous: 210 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "minutes-for-mhma-full-board-meeting-15-feb-26": {
    title: "Minutes for MHMA Full Board Meeting – 15-Feb-26",
    date: "March 25, 2026",
    attendees: "Asad Jafri, Asad Siddiqui, Faisal Shahid, Kanishka Ramyar, Mohamed Basha, Mohamed Mohamed, Nazeer Shaik, Oussama Saafien, Owais Khalid, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Tarik Khan, Umar Sear, Zafar Khan",
    content: `The MHMA board meeting was held on 15-Feb-26. The following meeting minutes were recorded:

**MINUTES**

**Agenda & Minutes**

**FR**

**Project Timelines**
9-12 month to get to city/county approvals on our Plan. Within 6 months of progress, we will have a clear idea if we are hitting the 9-12month timeline for approvals. We should have $1.5M in the bank to be comfortable.

**Final FR Target —** Agreed on $1M.
**Anchor Pitch —** None.

**Day Of Logistics / Agenda**
- Babysitting
- Iftar Dinner Logistics
- Heaters: Umar bhai has this covered. Back up – home depot
- Lights: Flood lights are here. Lights will be installed in the coming weeks
- Setup: Inside women setup as previous years and Men Seniors inside by the entrance. Men setup is outside under the tents. Same setup as last year. No table/chairs @Asad S leading
- Food and Distribution – Setup meeting today with Ilyas bhai.

**Taraweeh**
Sr Musarrat is leading and agreed. Get Al-Hayy families involved for praying.

**Action Items**
- Crosstrain a couple of BOD members on Spokesperson account / back-end @Umar S
- Sr Sadia to coordinate with Sr Musarrat to arrange for additional help all through the Ramadan
- To use the DBA for Siraj Center, connect with Barbara and get her guidance to start using this – meeting with Barbara on Tue 2/17 @Shahzad Ali`,
    data: {
      membership: { current: 208, previous: 206 },
      accounts: {
        operations: { current: "$51,918.08", previous: "$55,561.56" },
        membership: { current: "$39,291.94", previous: "$49,222.02" },
        masjid: { current: "$63,660.91", previous: "$45,315.81" },
        zakat: { current: "$19,505.03", previous: "$25,222.10" }
      }
    }
  },
  "minutes-for-mhma-board-of-trustees-meeting-04-mar-26": {
    title: "Minutes for MHMA Board of Trustees Meeting – 04-Mar-26",
    date: "March 23, 2026",
    attendees: "Asad Jafri, Kanishka Ramyar, Nazeer Shaikh, Owais Khalid, Shahzad Ali, Zafar Khan",
    content: `The MHMA board meeting was held on 04-Mar-26. The following meeting minutes were recorded:

**MINUTES**

**Topics:**

1- **Siraj Center**
– Siraj Center operations
– Sijra Center paperwork and documentation

2- **Parcel division**
– Document signing`,
  },
  "minutes-for-mhma-board-of-trustees-meeting-27-feb-26": {
    title: "Minutes for MHMA Board of Trustees Meeting – 27-Feb-26",
    date: "March 23, 2026",
    attendees: "Asad Jafri, Kanishka Ramyar, Owais Khalid",
    content: `The MHMA board meeting was held on 27-Feb-26. The following meeting minutes were recorded:

**MINUTES**

**MHMA BOT Meeting with Attendance from BOD**

**Fundraising & Ramadan Alignment**

**Key Focus Areas**

1. **Website & Donations**
• Improve website for donations
• Collect Ramadan donations
• Construction materials/details
• Improvements for the donation site

2. **Pledge Conversion**
• Convert pledges
• Prepare pledges/month breakdown

3. **Khatmul Qur'an Event Planning**
• Work with Shaykh Ammar
• Small postcard
• Event flyer
• Facebook and Instagram
• Video about the Kiswah
• Khatmul planning spreadsheet

4. **Logistics & Operations**
• Hidaya coordination
• Audio
• Tents
• Eid expenses

5. **Communications**
• email
• flyer with QR code
• SMS`,
  },
  "bod-minutes-for-mhma-board-of-directors-meeting-21-jan-26": {
    title: "BOD Minutes for MHMA Board of Directors Meeting – 21-Jan-26",
    date: "January 25, 2026",
    attendees: "Umar Sear, Asad Siddiqui, Saqib Malik, Faisal Shahid, Mohamed Basha, Sadia Khan, Sarfaraz Shaikh",
    content: `The MHMA board of directors meeting was held on 21-Jan-26. The following meeting minutes were recorded:

**MINUTES**

**Agenda**

**Ramadan**
planned expenses in 2026. In 2025, we spent $32K. Usually, we do not do planning on expenses, but we can add details (Internal).

- Hadiya – 2
- Babysitting
- Casita rental & airfare
- Iftars – sponsorship this time
- Tent –
- One-time renovation of UC
- Eid celebrations
- Flood light rentals / purchase

So far, we have not received sponsorships for Iftar. Draft separate messaging for iftar sponsorship and a separate note clearly articulating $250/family for Ramadan expenses (not iftar). Start a campaign with community.

**Eid Fair update**
Faisal bhai asked around in Tracy where there is a weekly fair, they hire each individual vendor separately for a month and organize the tracy fair. Mechanical bull; face painting, photo booth, jumpers, horse riding, petting zoo, magic show are some activities we organize at Ramadan.

**Flood Light rental:**
Umar bhai received quotes for $900/month for 2 lights or Purchase 2 lights through party rental. We also discussed the ideas on installing permanent flood lights on containers(both sides). This will not require continued storage, securing or moving effort that flood lights require. It is a one-time effort to install. All agreed we should move forward exploring with this option.

**501 c 3 Documentation**
Saqib bhai to upload and share the drive to centralize.

**Distribution of Funds (incoming/outgoing)**
Decision makers? This is BOT per bylaws. The two in question are Jummah collection and property tax payments. We will discuss these are the next full-board meeting and get BOT to align.

**MHMA Non-profit updates**
Core team met, discuss communication from Barbara, 1023-detail needs to be completed. Umar bhai will be completing this ASAP, target 1/25. Outstanding discussions with United Tax.

**Ramadan FR**
FR target for Masjid Construction – FR Committee to set.

**MHMA Committee Policy review**
Provided feedback on the policy. Asad S shared nuances between giving and taking authority outside of bylaws. Policies and procedures are operational documents and clarify how we should execute vs transfer of authority to someone of away from someone (as note in bylaws). We all agreed with this. Others to review the policy and finalize by end of next week. If no other comments, we will review and incorporate feedback provided and put the policy in force on a set agreed date.

**New Committee to liaison with LUSD** – Form it as a sub-committee under PR committee and get going.

**Action items**
- Siraj center comms to community and sharing news about donation matching @Umar S
- Agenda for next Full board to discuss bank accounts, funds categorization and get approval from BOTs @Asad S
- Research and share flood light for container installation @Saqib M
- Move forward with New Committee to work with LUSD @Umar S
- Share 501c3 shared drive with Asad @Saqib M`,
    data: {
      membership: { current: 209, previous: 209 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "minutes-for-mhma-board-of-trustees-meeting-13-jan-26": {
    title: "Minutes for MHMA Board of Trustees Meeting – 13-Jan-26",
    date: "January 22, 2026",
    attendees: "Asad Jafri, Kanishka Ramyar, Owais Khalid, Shahzad Ali, Zafar Khan",
    content: `The MHMA board meeting was held on 13-Jan-26. The following meeting minutes were recorded:

**MINUTES**

The Board of Trustees reviewed the proposed masjid design and layout to ensure it aligns with current and future community needs. The discussion emphasized incorporating community feedback and delivering meaningful value that reflects the growth and evolving needs of the congregation with a self-sustaining model.`,
  },
  "minutes-for-mhma-board-meeting-11-jan-26": {
    title: "Minutes for MHMA Board Meeting – 11-Jan-26",
    date: "January 17, 2026",
    attendees: "Asad Jafri, Asad Siddiqui, Kanishka Ramyar, Mohamed Basha, Mohamed Mohamed, Oussama Saafien, Owais Khalid, Sadia Khan, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Umar Sear, Zafar Khan",
    content: `The MHMA board meeting was held on 11-Jan-26. The following meeting minutes were recorded:

**MINUTES**

**Agenda & Minutes**

**Board Action Items**
Asad S presented to the board new process for logging/capturing board action items from both BOD and Full Board meetings. We discussed open action items and agreed on next steps with their respective owners.

**Construction Update**
Wood Rodgers were charging $15K, talked to Tauheed bhai, he noted he will charge $5k. WRs # is worst case but could be between 10-15K. They would work on surveys with MH city and submit the final parcel map. Moving fwd with WRs. Once submitted the process will take 3 months for SD to complete and we could execute the deed transfer.

**MHMA Non-Profit Status Update**
Shahzad A/Umar S – Not circled back with Barbara after holidays. Not yet filed the reinstatement. There are multiple possible ways in which reinstatement can be done, Barbara was supposed to conduct that research and share an update.

**Property Tax Update**
Alhumdulillah we have the retroactive approval on the 2acres. They may either give us credit towards next bill or money back for the last 3 years of property tax. AJ drafted an email to send out to SJC Tax office. They may audit the location once the email goes out – we first must study the handbook, understand the requirements, make the necessary changes to our site and show that we are utilizing majority of the land. No rush to send email as we must align on what changes we will make to the land. Asad S suggested again that we Talk to attorneys and understand what they can do for us vs us analyzing/interpreting the handbooks ourselves in our own individual capacities. The board agreed to explore the attorney option.

**Ramadan Update**
Saqib M update about meeting with Ilyas bhai on Ramadan planning. Suggested increase of Ramadan expenses to $250/family – this was agreed. There was a discussion on Iftar @UC in tents but we agreed to do it as planned. Souk committee is proposing to have a Souk night in Ramadan after Taraweeh(8). Idea – have some activities that kids can do outdoors – soccer, BB, etc. AJ provided update on Maktab team's ask. They need BB and play area for kids.

**Fund Raising Speakers –** Options – Shk Tamim Tarin, Imam Tahir, Shk Mohammed Alawi; Mufti Mudassir; Shk Hashim.

**Religious Committee – Follow up from BOT discussion on feedback from previous Board meeting**
Two topics discussed – Moon sighting & Hidaya Committee composition.

- **Moon Sighting –** MHMA seeks guidance from shayukhs on this and Hidaya provides recommendation. Last year Hidaya discussed with Shks and board agreed to move forward with local moon sighting.
- ZK – We have hired shayuks based on their credentials. They help us guide through these matters and provide path forward.

Board voted on the following question – Should we join FCNA?
- Yes – Mohamed Mohamed; Oussama Saafien
- No – rest of the board members voted no

**Decision:** MHMA will not join FCNA and will continue to follow Central Hilal Committee of NA.

**Topics moved to next meeting:**
- Hidaya Committee composition & Criteria to join
- Policies Pending Review
- MHMA Committees Calendar

**Action Items:**
- Setup meeting for Board to review and provide feedback on Masjid 3D floor plan @Asad S
- Talk to BOE attorneys to understand how they can help MHMA on property tax matter – @Asad S
- Identify companies who can help build containers with utilities for classes @Oussama
- Detailed site plan for UC Land for property tax purpose @ Asad J
- Get a quote for flood lights for the month vs daily @Asad S
- Send out flyer for Khatam Quran on 25th night of Ramadan @Kanishka

Note: Monthly Financial update was record in the BOD meeting notes hence the below numbers are $0`,
    data: {
      membership: { current: 210, previous: 210 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "minutes-for-mhma-board-of-trustees-meeting-06-jan-26": {
    title: "Minutes for MHMA Board of Trustees Meeting – 06-Jan-26",
    date: "January 11, 2026",
    attendees: "Asad Jafri, Kanishka Ramyar, Nazeer Shaikh, Owais Khalid, Shahzad Ali, Zafar Khan",
    content: `The MHMA board meeting was held on 06-Jan-26. The following meeting minutes were recorded:

**MINUTES**

**Topic Discussed:**
- Property Tax
- Masjid construction and related land development
- Hidaya committee structure
- Religious guidance and moon sighting options/techniques`,
  },
  "bod-minutes-for-mhma-board-of-directors-meeting-04-jan-26": {
    title: "BOD Minutes for MHMA Board of Directors Meeting – 04-Jan-26",
    date: "January 10, 2026",
    attendees: "Umar Sear, Asad Siddiqui, Saqib Malik, Faisal Shahid, Mohamed Mohamed, Oussama Saafien, Sadia Khan",
    content: `The MHMA board of directors meeting was held on 04-Jan-26. The following meeting minutes were recorded:

**MINUTES**

**Agenda**

**Financial Update**
Reviewed month-end Dec financials. Br Saqib provided a new view for expenses by category which was helpful to understand buckets (large and small). Asad S asked the q on why we do not pay Property Tax from Donation Account vs. Operations as the prop tax is a result of purchasing land for masjid and Jumma donations moved to Operations vs using for masjid. Pending decision on both but everyone on BOD agreed and we took an action. Reviewed Maktab expenses for Dec which resulted in discussion and review of Imam responsibilities for MHMA activities. Follow ups on these will be executed in subsequent Full Board meetings.

**Ramadan**
Asad S – We are 45days away and must form a team and identify lead. Umar bhai proposed br. Saqib to take the lead. We all agreed to support and help alongside volunteers. Asad S will lead all iftar setups & Faisal S is lead for Eid Mela.

**Ramadan Planning Lead –** Saqib
- Partner with MSA in HS
- Build a team with Sr Masarat to take care of kids
- Heaters – Test vendor came back and shared they made a mistake in initial quote and only included 1 week of heater costs($300) vs 4 weeks($1200). We agreed we do not need heater from vendor. Umar S suggested that should avoid using the propane heaters. Buy the heaters with hot air and we have one already that we have used before.

Br Oussama provided an update that he Canceled Human Appeal presence this Ramadan as we did not get Shk Jibreel.

**FCNA**
Mohamed – Aligning MHMA to FCNA. Will help with overall guidance on religious rulings/questions. Ex: Ramadan. Umar S – Currently MHMA is aligned with Hilal Committee of NA. How does this shift our approach and which madhab we follow? There are Pros and Cons. We should outline the purpose, benefits and Pros/Cons to be able to make a decision.

**Family Nights/Events/UC Bookings**
**Family Nights Plan(Br Mohamed)** – Schedule it for every 3rd Sat of the month. At times we will have to cancel (ex: Ramdan). Our 1st FN for 2026 will be Jan 17th. Two speakers lined up with topics – Halal Financing; Special Needs. Bringing on Br Asim Khan onboard to help MC FNs.

**Events Committee**
Revisit the event committee to coordinate all MHMA events across all programs. Centralize coordination, bookings and logistics.

**UC Bookings** has been an issue for many as to visibility. Umar S – Everyone should already have access to the MHMA calendar to view scheduled events and times. Also here they can view what slots are open for scheduling new events. This cal is already on Google. The new BOD/BOTs will be given access.

**Policies finalization and adoption**
What is the process of Creating, Reviewing and Approving policies? Once policy is circulated, we should give 3 weeks for everyone to review, provide comments, feedback and discuss comments. We should then pass a resolution to adopt or not. Once the policy is adopted only then it is enforced.

**MHMA Committees Updates**
Asad S shared the committee cadence calendar with the board. We have 14 committees currently and if we have each committee present once a qtr we will have to have an agenda topic by Committee on every weekly BOD meeting. BOD agrees to follow this cadence once the following is complete: All committees should have properly defined Purpose and Objectives, Targets and team structure.

**Action Items:**
- Review bylaws on how funds should be allocated/disbursed – Jumma donations, property taxes payouts – Who are the decision makers BODs or BOTs or combination @Umar @Asad
- Br Saqib to kick off Ramadan Planning
- Share heater(blowers) links with Asad to review and make purchases @Umar S
- Outline the purpose of aligning with FCNA – @Mohamed Mohamed
- Share access to the mhma95391 calendar with all Board members to review conflicts with CU availability as well as overlapping programs @Umar S
- Share the MHMA Committee Governance Policy with everyone to comment @Umar Sear
- Decision on Maktab be part of Education Committee – @Umar @Mohamed @Oussama
- Asad S to follow up with each MHMA committee to ensure we action the BOD recommended steps before we kick off Committee cadence`,
    data: {
      membership: { current: 210, previous: 210 },
      accounts: {
        operations: { current: "$55,561.56", previous: "$49,565.93" },
        membership: { current: "$49,222.02", previous: "$40,023.01" },
        masjid: { current: "$45,315.81", previous: "$105,316.19" },
        zakat: { current: "$25,222.10", previous: "$25,922.10" }
      }
    }
  },
  "minutes-for-mhma-board-meeting-21-dec-25": {
    title: "Minutes for MHMA Board Meeting – 21-Dec-25",
    date: "January 1, 2026",
    attendees: "Asad Jafri, Asad Siddiqui, Faisal Shahid, Kanishka Ramyar, Mohamed Mohamed, Oussama Saafien, Owais Khalid, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Tarik Khan, Umar Sear",
    content: `The MHMA board meeting was held on 21-Dec-25. The following meeting minutes were recorded:

**MINUTES**

**Agenda 12/21 Full Board Meeting**

**Construction Update**
Wood Rodgers(Civil engineers) came back with an ask of $15K to finish the sub-division update – Final Map approval for sub-division to be fully approved (conditions still apply – Construction of the Providence Rd completed within 3 years). We will be getting a 2nd opinion on that. We will have more update next Tuesday. We need help on conducting surveys that is where Wood Rodgers will come in handy, but we believe the city should have all these surveys and we would be able to avoid this. Earlier we received an invoice of $15K, majority of the scope of work from this invoice has been completed.

3 Year condition – if everything is done within 3 years. Those conditions expire and the city can impose additional conditions after. Alignment with QV has yet to happen. Suggestion: Invite Sandhu, do an event with him.

3D plan – Planning to present the 3D plan to the community. BOT suggestion was to conduct small group meetings with community and suggestion is to encourage within this for community members to increase membership donations to $100. Start with our large donors first. Discussion with Board and guidance to BOTs that we should not bring up memberships in these conversations and keep the discussion specifically to 3D plan, get feedback and encourage for donations.

**Property Tax Update & execution RACI**
AJ provided an update from his meeting with county officers. Shared about BOE, what MHMA can do a church. Spoke to supervisor of the BOE. Documented all notes and contact info. She provided a lot of new info. We have to convince her that we operate and our use of land is exactly as a church and that we are using the land for religious purposes. Out of 5 acres, we have an approval for 2 acres retroactively (verbally not in writing). We have to provide evidence for rest of 3 acres usage. Everything that we have done for last 2 years on the land – we should upload on website and collect centrally as evidence. Our mission statement should comply with religious activity/organization operations. We have to email the supervisor and get the process started to review the remaining land that is not exempt. Deadline is Jan 1st for retroactively update tax status.

Asad S created a RACI for execution as this framework will help in identifying roles & responsibilities in-line with bylaws and speed up execution and assistance needed with right people identified and accountable – we did not get a chance to review the RACI and will be discussing offline to finalize. Suggestion from Asad S to pursue Attorneys that specifically have expertise in BOE and property tax exemption. With expert guidance we will not only move in the right direction but also expedite the process.

**MHMA non-profit update**
We have been working with the Attorney on reinstatement process and overall guidance on structure. Completed the 1023 form for reinstatement but not filed. Attorney has noted that the non-profit explorer site has evidence that we have submitted tax return to IRS for 2023. Tax return FY 2022 not filed yet. Will continue to receive guidance from attorney on this. Currently MHMA has no intent to shift assets to a Waqf/estate plan with so much going on. We will, at a time agreed upon by board, will initiate a conversation again to establish this with guidance from a estate plan attorney.

**Structure of Religious Committee, Criteria & Voting to change**
Goal is to have all committees as inclusive and transparent as possible. Same applies to the religious committee. Observation is that current religious committee is specific to a region and suggestion from Oussama is to have it inclusive and diverse while also clarifying the criteria, qualification and enrollment of existing and new committee members. BOTs have an agenda item in the next meeting. Suggestion to discuss Religious Committee composition/structure of the committee. In connection to this agenda Umar S shared a draft policy.

**Ramadan prep & key decisions**
Asad S presented Ramadan Iftar setup options to the Board. Options included School, Tent & Containers. Recommendation is for Tents as it will be convenient for volunteers, women, food & taraweeh logistics. Total costs for tents are $4k or less in addition to heaters if we decide to add heaters. Board decision – Move forward finalizing the tent vendor for Ramadan. There was a suggestion from Sarfaraz to keep School as a plan B and if bookings can be canceled in a relatively short time-period we should have bookings in place. Suggestion from Umar S to organize Eid Mela on UC land, extending what we already do to be more elaborate and additional fun elements for kids and families. @faisal Shahid taking lead on this.

**Ramadan FR Ideas & strategy (BOTs)** Kanishka shared the consolidated list of ideas that BOTs discussed:
- Masjid-to-Masjid Fundraiser after Jumu'ah
- Streamline Announcements with Email Newsletter and add sponsor
- Hiring a Professional Fundraiser (touring masjids in large Muslim population areas such as Dallas)
- Pledging System (software-based collection system)
- Improve Our Website (reference to TIC version)
- Need Story for Our Masjid – "help build a masjid in the newest city in CA"
- Calendar for Fundraising (minimum 6-month view)
- Fundraise at California Masjids (within 2-hour drive)
- Improving Donation Landing Page (video, story, payment links)
- Snail Mail Campaign (nationwide)
- Ramadan Calendar to Attract Sponsors
- Islamic CRM (demo needed)
- Improve Friday Fundraising (Square, QR codes, kiosks)
- Increase Monthly Donation Program
- Ask Top Donors to Increase Monthly
- Special Dinner for Top Donors (with 3D walkthroughs of new Masjid)
- Tennis Club Fundraiser
- Cricket Team Fundraiser / 1 touch Tournament
- Grants (application process)
- Bay Area Fundraiser (dining hall event)`,
    data: {
      membership: { current: 210, previous: 210 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "bod-minutes-for-mhma-board-of-directors-meeting-14-dec-25": {
    title: "BOD Minutes for MHMA Board of Directors Meeting – 14-Dec-25",
    date: "December 19, 2025",
    attendees: "Umar Sear, Asad Siddiqui, Saqib Malik, Faisal Shahid, Mohamed Basha, Mohamed Mohamed, Oussama Saafien, Sadia Khan",
    content: `The MHMA board of directors meeting was held on 14-Dec-25. The following meeting minutes were recorded:

**MINUTES**

**Location:** Unit Center

**Agenda**

**Review Operational Expenses (including Maktab)**
BODs reviewed monthly operational expenses – walkthrough by Saqib M. The file with all details to the expenses is shared with all BODs. We also deep dived into Maktab as a program and its expenses. Overall Maktab is net positive now.

**Balady FR**
UC booked for 4 hrs on Dec 21st. Can provide a receipt at the end of the event for the sum collected if requested – do we need this? NO. A tax deduction receipt can be provided. Ask: Create a flyer with MHMA logo/template to show collaboration with Balady – We don't need to do this. Balady can have their own flyer.

**Decision:** No need to create flyer. MHMA approves them to conduct a FR under their own banner, they can use UC for the time already allocated.

**Ramadan Preparation Update and Human Appeal update / IMRC**
**Ramadan Iftar Arrangements**
Asad S gave an update at the BOD meeting today and had a follow up meeting with the vendor. In summary, our first preference was installing tents at UC so we continue to have iftars at our facility vs schools which would have been inefficient for many. I believe we have a great local option with good quality tents, the necessary equipment to secure them, keep them heated and an option to install/take-down over the weekends which will not require any city permits.

**Details**
Coordinated a meeting with the local vendor to visit Unity Center today and provide us a more accurate quote. Saqib bhai and I met with them. They took measurements of the space and we have decided to install 4 tents of 40×20 to cover the UC parking lot. We got an initial quote from the vendor for $4000 for 4 tents for 4 weeks with an additional day for the last week. Negotiated this to $3600. This includes installation every Friday and taking it down Sunday morning. For the last week (March 14th weekend) since we have khatam, we want the tent to be taken down on Monday instead of Sunday. We also asked for heaters and they provide the gas heaters for indoor-tent use for $50/heater. Saqib and Asad S agreed that we should just rent it from the vendor as they will be responsible for their tents instead of us adding our heaters later.

**Recommendation –** Move forward and finalize this vendor after sharing with Full Board on 12/21.

**Ask is for 27th** Decision: If Shk Jibreel is not available then we do not need to allow it.

**IMRC:** Have them come over upcoming jumma and setup a table.

**Agenda Topics Not Covered**
- Board Process for assigning responsibilities
- Family Nights/Events
- MHMA Committees Review

**Action Items:**
- Combine Income and expenses by program for visibility of Board @Saqib
- Any new activity/program requests that community members have(ask for), they should share the request with the Board to be evaluated. If they reach out to BOD/BOTs, we can direct them to send email request @All BODs
- We must create a backlog of new program/activity requests @Asad S
- Determine how many members vs non-members are registered in Maktab. How many of the registered are residents of MH vs outside @Umar S
- Discuss with Maktab team to reduce Maktab to 3 days a week to free up one additional day other than Friday for other MHMA activities. Suggestion is Thursday @Umar S

Note: Financial numbers will be updated once a month. The Month-ending Nov 2025 have already been published in the previous BOD meeting minutes. The next will be in Jan to cover Month-ending Dec 2025`,
    data: {
      membership: { current: 210, previous: 210 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "minutes-for-mhma-board-of-trustees-meeting-16-dec-25": {
    title: "Minutes for MHMA Board of Trustees Meeting – 16-Dec-25",
    date: "December 18, 2025",
    attendees: "Asad Jafri, Kanishka Ramyar, Owais Khalid, Shahzad Ali, Tarik Khan",
    content: `The MHMA board meeting was held on 16-Dec-25. The following meeting minutes were recorded:

**MINUTES**

Getting input from scholars, community members , leaders and discussed defining a shared long-term vision for the organization.

Efforts  to document active use of the property.

Ongoing review and clarification of bylaws.

Improvement to the financial structures discussion in compliance with Local, State and Fed rules and laws

Discussed various feedback from community members regarding Jumma timing, etc. 
Discussion about a plan to encourage earlier Jumma prayer attendance.

Explored options and processes to ensure cost effective operations. 

Masjid construction updates.

Fundraising ideas were reviewed and compiled into a working strategy.`,
  },
  "minutes-for-mhma-board-of-trustees-meeting-09-dec-25": {
    title: "Minutes for MHMA Board of Trustees Meeting – 09-Dec-25",
    date: "December 18, 2025",
    attendees: "Asad Jafri, Kanishka Ramyar, Nazeer Shaikh, Owais Khalid, Shahzad Ali",
    content: `The MHMA board meeting was held on 09-Dec-25. The following meeting minutes were recorded:

**MINUTES**

The BOT reviewed initial planning for the community center, with a primary focus on construction planning and architectural design. Key discussions included optimizing the layout of the masjid, improving accessibility and flow, and ensuring functional spaces for families, travelers, women, youth, and community needs. Design considerations included proper masjid areas placement.`,
  },
  "bod-minutes-for-mhma-board-of-directors-meeting-07-dec-25": {
    title: "BOD Minutes for MHMA Board of Directors Meeting – 07-Dec-25",
    date: "December 11, 2025",
    attendees: "Umar Sear, Asad Siddiqui, Saqib Malik, Mohamed Basha, Mohamed Mohamed, Oussama Saafien, Sadia Khan, Sarfaraz Shaikh",
    content: `The MHMA board of directors meeting was held on07-Dec-25. The following meeting minutes were recorded:

**MINUTES**

**Agenda**

**Financial Update**
Decision: We will start with financial update every 1st week of the new month so it covers the prior month-closing

**Ramadan Operational Preparation**
Discussed establishing a Ramadan Committee. It should be their mandate to plan and execute the Ramadan operations.
The process of establishing committee may slow down planning, implementing/executing many tasks.
We should not pause any progress and decisions BOD must make. In parallel we could establish a committee and have them execute decisions. We encourage committee coming up with new process and ideas and they should evaluate and suggest to BOD
There is also a proposal to establish committee but make it effective from next year

**Decisions to be made immediately**
- Iftar Setup & How many Iftars
- Options
- Suggestion to do Iftar in schools. Prefer HS. Cordes & Hansen has the biggest MPR. One for Women & Men. HS first preference, then we should pursue Cordes/Hansen
- Large Enclosed Tents with heaters
- Container
- Who will lead Taraweeh – Sh Ammar is available only until the 25th night of Ramadan and wants to fly back to celebrate eid with his family. Discussed this topic boradly with BOTs as well and we will confirm Shk Ammar to join. Khatam Quran will be decided as soon as we start Ramadan

**Compliance to Bylaws**
Revisit and review existing core committees, their committee members, charters, objectives and re-align if necessary
Understanding of bylaws and executing in compliance of these is important for every BOD.

**Improving BOD alignment, communication & responsibility clarity**
BOD responsibilities. Named roles leading specific programs/projects.
Come up with an approach to assign project/programs to BOD members and reasoning on why vs being selective and having offline conversations where work is discussed/assigned. Frequent updates on progress per BOD/role

**MHMA Committees & Announcements**
As a BOD we must revisit all committees, their structure, mandate, committee composition and create a frequent cadence for them to come present progress at BOD
Communication to community (with the caveat/option that we will evolve) officially needs to happen within six weeks of coming into office of a new Board of Directors
Concerns raised on structure of Hidaya Committee. Representing single school of thought. more discussion to happen on this in next meeting with the right attendees

**Action Items**

- Provide breakdown of Operational expense going forward w/Maktab as a top priority @Saqib
- Setup a Ramadan specific meeting on Monday 12/8 to further deliberate @Asad S/Saqib
- Bring the topic about Religious Committee back to the agenda and discuss @Asad S
- Have a specific meeting to review all MHMA Core Committees @Asad S
- Assigning R&R to BODs and criteria on doing this – TBD
- Following Agenda which was not covered, moved to a future meeting

**MHMA 2026 BOD Goals/Objectives**
- Family Nights / Events`,
    data: {
      membership: { current: 210, previous: 210 },
      accounts: {
        operations: { current: "$49565.93", previous: "$51210.07" },
        membership: { current: "$40023.01", previous: "$50247.06" },
        masjid: { current: "$105316.10", previous: "$202800.38" },
        zakat: { current: "$25922.10", previous: "$27971.51" }
      }
    }
  },
  "minutes-for-mhma-board-of-trustees-meeting-26-nov-25": {
    title: "Minutes for MHMA Board of Trustees Meeting – 26-Nov-25",
    date: "November 30, 2025",
    attendees: "Asad Jafri, Kanishka Ramyar, Nazeer Shaikh, Owais Khalid, Shahzad Ali, Tarik Khan",
    content: `The MHMA board meeting was held on 26-Nov-25. The following meeting minutes were recorded:

**MINUTES**

The Board of Trustees met to discuss the year end fundraising event, including logistics, advertising, speakers, and organizational readiness. The BOT reviewed questions related to tax status, donation handling, and compliance to ensure the community is served responsibly.

Broader topics such as other community needs and future construction planning were also discussed.

The BOT will continue coordinating details to support a smooth and compliant fundraising effort.`,
  },
  "minutes-for-mhma-board-of-trustees-meeting-23-nov-25": {
    title: "Minutes for MHMA Board of Trustees Meeting – 23-Nov-25",
    date: "November 30, 2025",
    attendees: "Asad Jafri, Kanishka Ramyar, Nazeer Shaikh, Owais Khalid, Shahzad Ali, Tarik Khan",
    content: `The MHMA board meeting was held on 23-Nov-25. The following meeting minutes were recorded:

**MINUTES**

The Board of Trustees met to review fundraising activities and ensure alignment with the organization's tax-exempt status. The BOT also discussed increasing the frequency of meetups.`,
  },
  "minutes-for-mhma-full-board-meeting-24-nov-25": {
    title: "Minutes for MHMA Full Board Meeting – 24-Nov-25",
    date: "November 29, 2025",
    attendees: "Asad Jafri, Asad Siddiqui, Faisal Shahid, Kanishka Ramyar, Mohamed Basha, Mohamed Mohamed, Nazeer Shaik, Owais Khalid, Sadia Khan, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Tarik Khan, Umar Sear, Zafar Khan",
    content: `The MHMA board meeting was held on24-Nov-25. The following meeting minutes were recorded:

**MINUTES**

**Location:** Unit Center

**Agenda & Minutes**

**Operating Principles – Brown Act and Rosenberg Rules**
Brown Act: applicable to public governing bodies only – helps in decision making, transparency of decision to the public. It requires us to be conducting our meetings in public, deliberations in public (how a board member votes on decisions etc. is publicly done). We could deliberate in private (in Board meetings) but share decisions publicly.
Rosenberg Rules: How deliberations and meetings are conducted. City Council example – the way meetings are conducted, how motions are handled, etc.
Suggestion:
Review these from an Islamic lens and understand what is applicable and can be adopted.
Applicability on non-profits vs government bodies. Our structure and governance are mainly driven by bylaws. We will have to look at what we can adopt to help streamline and be efficient vs follow these as-is

**Board Operations**
**BOD vs BOT Operating Model**
BOD & BOT Meeting
Both these bodies must have separate meetings with BODs meeting at-least once a month (per bylaws) and meet as full Board at a set cadence
Opinion is that MHMA has much to do so expecting BODs to have more regular meetings
BOT will decide what their frequency of meetings
BOT Chair
Shahzad Ali is the BOT chair. All BOTs voted unanimously for Shahzad to be elected for a term of 1 year

**Overlapping Projects**
Projects (in this case): A project that needs only board oversight and decision making to execute (would not have external community members involved). Ex: MHMA Non-profit Status
Construction of Masjid, Maktab, Hidaya are all programs or projects executed through committees. Committees must have a cadence to update progress to the BODs

**BOT <> BOD transitions**
We agreed that there are no projects/programs that need a formal transition to the BOD or vice versa

**Sanctity of the Board**
Discipline around motions/decisions etc similar to what we discussed on brown act and Rosenburg rules

**MHMA Non-Profit Org Status updates, owners & next steps**
**Non-Profit Reinstatement**
Barbara Rhomberg is hired officially to help with reinstatement
Filing form 1023 – In progress

**Tax Preparation**
Engaging with Tax Path to help with go forward tax preparation and filing. Once the reinstatement is completed. Tax Path will be hired
Also spoke to United Tax (Abbas) – they can help as an advisor

**Masjid Update – sub-division, design update (Moved to next meeting)**
We did not get the time to cover this topic in detail as the main agenda topic

**MHMA Committees**
Two types of committees – Statutory and non-statutory. Statutory committees must exist as per bylaws. Committees are advisory bodies. The decision-making power resides with the BODs
All committees report back to BODs except the construction and religion that report to BOTs
Purpose, goals, outcomes/success should be defined upfront.

**Finance Update**
Provided the update at the previous Nov meeting.
Updated Qard-e-Hasana numbers: $40,000 outstanding
Full Board Pledge ceremony took place in the Open Public Session

"I pledge to serve the Mountain House Muslim community sincerely, following the guidance of the Qur'an and Sunnah to the best of my ability.I will support and protect the mission, goals, and bylaws of the Mountain House Muslim Association. I will serve without fear, favor, or discrimination, and act with honesty, fairness, and integrity. I will avoid conflicts of interest, preserve the trust and property of the community, and fulfill my duties with transparency and accountability. I will work collaboratively for the unity, welfare, and success of our community.I make this commitment for the sake of Allah, seeking His guidance and His pleasure alone. Ameen."`,
    data: {
      membership: { current: 195, previous: 210 },
      accounts: {
        operations: { current: "$45063.04", previous: "$51210.07" },
        membership: { current: "$41454.37", previous: "$50247.06" },
        masjid: { current: "$193656.99", previous: "$202800.38" },
        zakat: { current: "$31171.51", previous: "$27971.51" }
      }
    }
  },
  "minutes-for-mhma-board-of-trustees-meeting-12-nov-25": {
    title: "Minutes for MHMA Board of Trustees Meeting – 12-Nov-25",
    date: "November 22, 2025",
    attendees: "Asad Jafri, Kanishka Ramyar, Nazeer Shaikh, Owais Khalid, Shahzad Ali, Tarik Khan, Zafar Khan",
    content: `The MHMA board meeting was held on 12-Nov-25. The following meeting minutes were recorded:

**MINUTES**

**Location:** Unity Center

**Organizational Reinstatement**
The trustees reaffirmed that reinstating MHMA's organizational status is the top priority.

An attorney has been selected to lead the process.

Work is underway to complete the necessary filings as efficiently as possible.

**Strengthening MHMA's Structure**
To better protect community assets and future projects, trustees discussed a plan to:

Establish a stronger, more secure organizational structure, and

Ensure MHMA follows best practices used by other large masajid and Islamic nonprofits.

Research is currently being gathered from well-established organizations across California.

**Improving Administrative Systems**
The trustees emphasized the importance of:

Timely tax filings

Accurate bookkeeping

Regular internal reviews

Long-term compliance and accountability

These improvements aim to ensure MHMA remains stable, transparent, and well-managed for years to come.

**Improving Administrative Systems**
Trustees tasked with gathering best practices from similar organizations (masajid, Islamic orgs).`,
  },
  "minutes-for-mhma-general-body-meeting-15-nov-25": {
    title: "Minutes for MHMA General Body Meeting – 15-Nov-25",
    date: "November 20, 2025",
    attendees: "Asad Jafri, Asad Siddiqui, Asif Alvi, Aynan Chaudhary, Faisal Shahid, Mohamed Basha, Owais Khalid, Sadia Khan, Saqib Malik, Shahzad Ali, Tarik Khan, Umar Sear, Zafar Khan",
    content: `The MHMA board meeting was held on15-Nov-25. The following meeting minutes were recorded:

**MINUTES**

**Board Attendees:** Umar Sear, Saqib Malik, Asad Siddiqui, Tarik Khan, Mohamed Basha, Asad Jafri, Faisal Shahid, Shahzad Ali, Mohamed Mohamed, Sadia Khan, Owais Khalid, Zafar Khan, Asif Alvi, Aynan Chaudhry, Nazeer Shaik, Kanishka Raymar 

**Meeting Notes**

The general body meeting was presided by the President with the following agenda in the form of prepared material 

**Introduction of new Board** 
Shared new and outgoing board of directors as well as board of trustees and discussed high-level responsibilities  

**Organizational Updates** 
**Non-profit Tax-Exempt Status**  
Shared with community about automatic revocation (alleged missing filings 2021-2024), noted that MHMA filed an appeal with proof of submitted returns and IRS acknowledgement—additional 60 days for review. Due diligence was completed Sept-Oct 
Next Steps: MHMA has Engaged experienced tax attorney for tax-exempt reinstatement. MHMA also hired new professional tax preparer, and we are strengthening internal filing & compliance process while we reclassify as a "Church" to ensure long-term compliance 

**Property Tax**  
MHMA paid property tax of $18,431.52 in 2024 and $43,736.16 in 2025. This has to be paid when we have a vacant land and is taxable even if we are a non-profit tax-exempt org as the land is not being actively used for operations.  
MHMA is actively working with the county and have achieved partial tax exemption. Continuing efforts to further reduce or eliminate property tax 

**Land Sub-Division**  
Conditional Approval received from the city. Notices sent to property neighbors within required radius. No need for public hearing. Should be finalized in the coming days 

**Governance**  
Shared that MHMA Board will be adopting established best practices. For ex: Rosenburg rule, etc  

**Financial Update**  
Shared with community details of Account balance (Operations, Masjid Donations, and Qard). Provided an update on expenses and membership count  

**Open Q&A** 
**Suggestions from Community**: 

Multiple community members emphasized on responsibility. Some noted that if the bylaws note "oversee" then it creates ambiguity and there should be someone that should be responsible for directly leading and be accountable 
Workshops to educate community members about the by-laws. this would help increase engagement and ensure everyone has a clear understanding of our rules and processes and will avoid many back and forth questions 
To keep MHMA as non-profit, keep it compliant and avail benefits of being a non-religious (not as church)  
Get feedback from community on events and programs being conducted. Let's have a formal feedback process and share results consistently. Community will know that feedback is being considered, and improvements are happening 
Have events lead by the youth. Instead of the adults give opportunity to youth to lead activities. Recognize youths formally and have a practice to do this frequently 
Transparency and follow-up on the process of committee selection and closing the loop with members who apply  
A team dedicated to responding to emails from community in a timely manner  
Establish a women's committee 
Use of OKRs  
*not all suggestions are included. we have requested some members to send suggestions via email as they had some great detail included. 

**MEETING ATTENDEES**

Asad Jafri, Asad Siddiqui, Asif Alvi, Aynan Chaudhary, Faisal Shahid, Mohamed Basha, Owais Khalid, Sadia Khan, Saqib Malik, Shahzad Ali, Tarik Khan, Umar Sear, Zafar Khan`,
    data: {
      membership: { current: 210, previous: 195 },
      accounts: {
        operations: { current: "$51210.07", previous: "$45063.04" },
        membership: { current: "$50247.06", previous: "$41454.37" },
        masjid: { current: "$202800.38", previous: "$193656.99" },
        zakat: { current: "$27971.51", previous: "$31171.51" }
      }
    }
  },
  "minutes-for-mhma-board-meeting-26-oct-25": {
    title: "Minutes for MHMA Board Meeting – 26-Oct-25",
    date: "November 2, 2025",
    attendees: "Asad Jafri, Asad Siddiqui, Asif Alvi, Aynan Chaudhary, Faisal Shahid, Mohamed Basha, Owais Khalid, Sadia Khan, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Tarik Khan, Umar Sear, Zafar Khan",
    content: `The MHMA board meeting was held on26-Oct-25. The following meeting minutes were recorded:

**MINUTES**

Discussed IRS letter regarding past 3 years tax filing.
General body meeting to be held on 11/15 at UC – timing to be finalized based on availability.
Temporary road to access UC parking has been completed by Lennar.
Application for property tax exemption is pending with the county. Hope to hear back in the next 4 weeks.
UC land subdivision is under final stages of approval. No public hearing will be done by the city.`,
    data: {
      membership: { current: 195, previous: 194 },
      accounts: {
        operations: { current: "$3608.00", previous: "$778.00" },
        membership: { current: "$41454.00", previous: "$37911.00" },
        masjid: { current: "$193656.00", previous: "$155912.00" },
        zakat: { current: "$31171.00", previous: "$1191.00" }
      }
    }
  },
  "minutes-for-mhma-board-meeting-21-sep-25": {
    title: "Minutes for MHMA Board Meeting – 21-Sep-25",
    date: "September 23, 2025",
    attendees: "Asad Jafri, Asad Siddiqui, Aynan Chaudhary, Faisal Shahid, Mohamed Basha, Oussama Saafien, Owais Khalid, Sadia Khan, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Umar Sear, Zafar Khan",
    content: `The MHMA board meeting was held on21-Sep-25. The following meeting minutes were recorded:

**MINUTES**

Masjid Sight plan discussion
Education committee update for WISH Program`,
    data: {
      membership: { current: 197, previous: 194 },
      accounts: {
        operations: { current: "$778.97", previous: "$5592.00" },
        membership: { current: "$37911.48", previous: "$15588.00" },
        masjid: { current: "$155912.66", previous: "$304190.00" },
        zakat: { current: "$1191.95", previous: "$23947.00" }
      }
    }
  },
  "minutes-for-mhma-board-meeting-15-feb-25": {
    title: "Minutes for MHMA Board Meeting – 15-Feb-25",
    date: "September 6, 2025",
    attendees: "Asad Jafri, Asif Alvi, Mohamed Basha, Oussama Saafien, Owais Khalid, Saqib Malik, Sarfaraz Shaikh, Tarik Khan, Umar Sear",
    content: `The MHMA board meeting was held on15-Feb-25. The following meeting minutes were recorded:

**MINUTES**

Discussion regarding Juma khateeb – qualifications, references, renumeration
MHMA property tax refund
continue discussion with the county
PR committee has been formed under Umar Sear's leadership
Board approved to clean up the land behind the UC building
facilitate parking and other activities
can be used for property tax exemption
Discussion on Ramadan preparation and activities
Discussion on Ramadan fund raising`,
    data: {
      membership: { current: 193, previous: 195 },
      accounts: {
        operations: { current: "$9690.00", previous: "$4787.00" },
        membership: { current: "$74232.00", previous: "$83308.00" },
        masjid: { current: "$90711.00", previous: "$186299.00" },
        zakat: { current: "$34358.00", previous: "$24758.00" }
      }
    }
  },
  "minutes-for-mhma-board-meeting-26-may-25": {
    title: "Minutes for MHMA Board Meeting – 26-May-25",
    date: "September 6, 2025",
    attendees: "Asad Jafri, Asad Siddiqui, Asif Alvi, Aynan Chaudhary, Mohamed Basha, Oussama Saafien, Sadia Khan, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Tarik Khan, Umar Sear",
    content: `The MHMA board meeting was held on26-May-25. The following meeting minutes were recorded:

**MINUTES**

Eid al Adha preparations
Venue, Khateeb, Food, Activities
Discussion on community's feedback on aligning with Saudi for new month.
Board decided to continue with the local moonsighting method currently being used.
Discussion on posting of flyers from other organizations
The board has adopted a reciprocal policy where the organizations that agree to post MHMA flyers on their organization's social media will be allowed to post flyers on MHMA groups – WhatsApp and Facebook.
MHMA property tax exemption form to be sent to the county.`,
    data: {
      membership: { current: 193, previous: 193 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "minutes-for-mhma-board-meeting-22-jun-25": {
    title: "Minutes for MHMA Board Meeting – 22-Jun-25",
    date: "August 30, 2025",
    attendees: "Asad Jafri, Asad Siddiqui, Asif Alvi, Asif Ruhi, Faisal Shahid, Oussama Saafien, Owais Khalid, Sarfaraz Shaikh, Tarik Khan, Umar Sear",
    content: `The MHMA board meeting was held on22-Jun-25. The following meeting minutes were recorded:

**MINUTES**

Property tax exemption
Umar has filled the form and is checking with the county if any further details are needed.

Construction update
County has responded with some comments and drawing suggestions.
Asad J to review with Br. Tauheed to go over the comments and respond based on his feedback
Asim Khan is working on revised parking plan

MHMA Membership
Members only whatsapp group has been created
Ansar program flyer is being finalized. This is for non-members to join and become an Ansar

Update MHMA official mailing address
Umar and Saqib are working with the Annex to activate the mailbox outside the UC

MHMA Election – EC formation, open positions, dates
Saqib is leading the effort to create the EC and will post message on forum

UC rental reimbursement
No payment received from MH city since Aug 2024. Umar is meeting with Sarah (financial controller) on Thursday. $8000 per quarter is average.`,
    data: {
      membership: { current: 196, previous: 193 },
      accounts: {
        operations: { current: "$3617.00", previous: "$15640.00" },
        membership: { current: "$19825.00", previous: "$60470.00" },
        masjid: { current: "$229228.00", previous: "$467400.00" },
        zakat: { current: "$24947.00", previous: "$35618.00" }
      }
    }
  },
  "minutes-for-mhma-board-meeting-24-jul-25": {
    title: "Minutes for MHMA Board Meeting – 24-Jul-25",
    date: "August 30, 2025",
    attendees: "Asad Jafri, Asad Siddiqui, Mohamed Basha, Oussama Saafien, Owais Khalid, Saqib Malik, Umar Sear",
    content: `The MHMA board meeting was held on24-Jul-25. The following meeting minutes were recorded:

**MINUTES**

Lot subdivision
ongoing meeting with the city. Awaiting their formal response
meeting setup with the city and investor group

Property tax
all relevant information and forms submitted to the county. Awaiting their response.
discussed various programs/proposals
Mommy and me – for mothers with young children
Home schooling
Hifz program
basketball court and play structure at UC`,
    data: {
      membership: { current: 194, previous: 196 },
      accounts: {
        operations: { current: "$5592.00", previous: "$3617.00" },
        membership: { current: "$15588.00", previous: "$19825.00" },
        masjid: { current: "$304190.00", previous: "$229228.00" },
        zakat: { current: "$23947.00", previous: "$24947.00" }
      }
    }
  },
  "minutes-for-mhma-board-meeting-24-aug-25": {
    title: "Minutes for MHMA Board Meeting – 24-Aug-25",
    date: "August 30, 2025",
    attendees: "Asad Jafri, Asif Alvi, Aynan Chaudhary, Faisal Shahid, Oussama Saafien, Owais Khalid, Sadia Khan, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Tarik Khan, Umar Sear",
    content: `The MHMA board meeting was held on24-Aug-25. The following meeting minutes were recorded:

**MINUTES**

Property tax non-profit reduced rate application still pending with the county. All relevant forms have been submitted.
MHMA and the investor group are meeting this week to respond to city's queries on the land subdivision.
A few new members have joined MHMA. Need to continuously remind people to join to enable the level activities being undertaken.
MHMA postal mailbox has been setup in the town center. The official address is 250 E. Main St., MH.
Discussion regarding the ownership and response time of the community member's email to the board.
if the email/proposal can be discussed offline, then respond with a week
else, review in the next board meeting and respond accordingly
Discussion regarding fund raising by outside organizations.
a formal process to review and permit fundraising is being developed
Criteria to join MHMA committees
the board nominates a board member to lead a committee
the lead seeks committee members from the community and decides on who can join the committee
the board oversees the committee and its performance`,
    data: {
      membership: { current: 194, previous: 194 },
      accounts: {
        operations: { current: "$7094.00", previous: "$5592.00" },
        membership: { current: "$31147.00", previous: "$15588.00" },
        masjid: { current: "$138640.00", previous: "$304190.00" },
        zakat: { current: "$19747.00", previous: "$23947.00" }
      }
    }
  },
  "community-commitment-and-connection-weekend-of-purpose": {
    title: "Community, Commitment, and Connection: A Weekend of Purpose at MHMA",
    date: "March 20, 2025",
    attendees: "",
    content: `This weekend at MHMA was a perfect reflection of what makes our community strong — dedication, teamwork, and shared values. In just two days, we witnessed two outstanding events: a meaningful Hajj Workshop and an engaging Lego competition. Both reminded us how powerful it is when we come together to learn, grow, and support one another.

**A Spiritual Journey: The Hajj Workshop**
On Saturday, Sister Khadeja led a deeply impactful Hajj Workshop. Her clarity, care, and depth of knowledge made the session an inspiring experience for attendees of all ages. She walked us through the meaning and steps of Hajj with a perfect blend of information and reflection.

This workshop wasn't just about learning — it was about connecting with our faith. Through her leadership, Sister Khadeja helped participants understand the spiritual purpose behind each step of the pilgrimage. It was an experience that left a lasting impression on everyone present.

**Learning Through Play: The Lego Competition**
On Sunday, the community gathered again for a different kind of event — the Lego competition, led and organized by Muhammad Waqas. This event focused on structured model-building, where children followed standard designs to complete their projects.

While creativity wasn't the focus, the event was still full of valuable moments. The kids showed focus, patience, and teamwork. They supported each other, followed instructions carefully, and completed their models with pride. It was a joy to see so many young faces fully engaged, learning to follow guidelines while having fun in a positive, social setting.

Thanks to Muhammad Waqas's thoughtful planning and calm leadership, the competition was well-run and enjoyable for all.

**Volunteers: The Silent Engines Behind Every Event**
At the heart of both events — and every event at MHMA — are our incredible volunteers. These individuals consistently give their time, energy, and effort to serve the community, often without recognition. They take on tasks large and small, always with dedication and care.

Their behind-the-scenes work is what makes everything possible. From setting up venues to managing logistics, greeting guests to cleaning up afterward — they do it all. And they do it with heart. We are endlessly grateful for their contribution.

**Members: The Backbone of MHMA**
We also want to sincerely thank our MHMA members. Your support through membership fees is what sustains this organization and allows us to host events like these — not just occasionally, but dozens of times every month.

Your commitment to MHMA helps us provide consistent, high-quality programming for people of all ages. It allows us to plan, grow, and serve. By maintaining your membership, you're not just helping the organization run — you're investing in the future of this community.

**The Children: Our Shared Joy**
And of course, a special thanks to the children who participated in the Lego competition. You brought focus, fun, and friendliness to the event. Your patience, willingness to follow the rules, and kind attitude toward each other made the day a success.

Your smiles are the reason we work so hard to organize these events. Seeing you enjoy, learn, and grow — that's the greatest reward for all of us.

**Looking Ahead**
This weekend was a wonderful snapshot of what MHMA does all year round. With dozens of activities each month, there is always something happening — something to learn, something to celebrate, and someone to connect with.

To Sister Khadeja, Muhammad Waqas, every volunteer, every member, and every participant: thank you. You are what makes MHMA not just an organization, but a true community.

Let's keep the momentum going — together.`,
    data: {
      membership: { current: 0, previous: 0 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "minutes-for-mhma-board-meeting-26-apr-25": {
    title: "Minutes for MHMA Board Meeting – 26-Apr-25",
    date: "May 24, 2025",
    attendees: "Asad Jafri, Asif Alvi, Aynan Chaudhary, Owais Khalid, Sadia Khan, Saqib Malik, Sarfaraz Shaikh, Shahzad Ali, Zafar Khan",
    content: `The MHMA board meeting was held on26-Apr-25. The following meeting minutes were recorded:

**MINUTES**

Currently qarz-e-hasna is $762,000 out of which $300,000 needs to be returned in the next couple of weeks.

**Ramadan Fundraising update**
747,230 were pledged
$211,081 received so far
210 donors
28% conversion rate

**Masjid Construction update**
Land subdivision application has been submitted. City has cashed the check.
Asad Jafri will follow up with the city in the next week.
Also planning to meet with Br. Tauheed from Brentwood masjid regarding the next steps
Building design packet also needs to be submitted. The goal is to be ready for submission in the next 3 months.

**Property tax refund**
$18,431 was paid in December. $43,736 was paid on 4/23
Umar Sear is working with the county to get the tax waived owing to non profit / religious organization status.

**MHMA General Body meeting**
Planned for the last week of May.`,
    data: {
      membership: { current: 193, previous: 193 },
      accounts: {
        operations: { current: "$15640.00", previous: "$9690.00" },
        membership: { current: "$60470.00", previous: "$74232.00" },
        masjid: { current: "$567000.00", previous: "$843689.00" },
        zakat: { current: "$35618.00", previous: "$28358.00" }
      }
    }
  },
  "amazing-festivities-at-the-mountain-house-muslim-association-eid-event": {
    title: "Amazing Festivities at the Mountain House Muslim Association Eid Event",
    date: "April 2, 2025",
    attendees: "Aliza Sear",
    content: `I think that it was well organized and overall very fun. The entertainment was really good this year. An issue I would say is that many of the women didn't feel comfortable participating in the bull ride because of the lack of gender separation. Having an indoor and outdoor area was really good especially since it was raining. I think the food could have been better. I think the organization could have been better, such as having signs to point towards different entertainment options, or line organizers.

Aliza Sear
April 2nd, 2025`,
    data: {
      membership: { current: 0, previous: 0 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "great-event": {
    title: "Great Event",
    date: "April 2, 2025",
    attendees: "Umar Sear",
    content: `Excellent Event

Umar Sear
April 2nd, 2025`,
    data: {
      membership: { current: 0, previous: 0 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "serving-our-community-with-transparency": {
    title: "Serving Our Community with Transparency",
    date: "March 20, 2025",
    attendees: "",
    content: "",
    isImage: true,
    imageUrl: "/Community-Response.webp",
    data: {
      membership: { current: 0, previous: 0 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      },
      image: "/Community-Response.webp"
    }
  },
  "we-respect-the-wisdom-of-the-elders": {
    title: "WE RESPECT THE WISDOM OF THE ELDERS",
    date: "March 20, 2025",
    attendees: "",
    content: `Islam teaches us to respect our elders and not say a harsh word to them. A society that does not respect the wisdom of it's elders is prone to make the same mistakes over and over.

- give respect
- be kind
- Learn from their wisdom

When we follow the simple rules listed above, we as the community benefit from the experience and wisdom of our elders and avoid making the mistakes that they made and learnt from`,
    data: {
      membership: { current: 0, previous: 0 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "our-youth-our-future": {
    title: "OUR YOUTH, OUR FUTURE",
    date: "March 20, 2025",
    attendees: "",
    content: `The youth of a community bring vibrance and fresh dynamics, un-encumbered with the past; they are open to fresh ideas and the energy to try new and bold things.

- Provide the youth with the best Islamic education
- Provide a collaborative environment for the youth to make lifelong friendships
- Provide youth the opportunity to participate in health sports activity
- Youth character building through diverse programming.

Have confidence in the ability of our young generation, give them the best education and guidance and pray to Allah SWT to make them a shining example for the world.

**EVERY MOMENT COUNTS**
We understand the value of time, especially for the young in our society. We put a lot of focus on youth-based activities for all ages. We want the young Muslims of Mountain House to have all the right opportunities and access to education, guidance, and physical activity.

If you have a child in your household, make sure to enrol them in one of many MHMA run programs today!`,
    data: {
      membership: { current: 0, previous: 0 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "we-believe-in-unity": {
    title: "WE BELIEVE IN UNITY",
    date: "March 20, 2025",
    attendees: "",
    content: `Unity in faith is one of the most fundamental tenets of Islam. What joins Muslims together is not the color of their skin, gender, language, or country of origin. We are bound together in brotherhood for believing in Allah (SWT) as the only God and Muhammad (PBUH) as his Messenger and the last Prophet.

- Worship only God (17:22)
- Be kind, honourable and humble to one's parents (17:23-24)
- Be neither miserly nor wasteful (17:26-29)
- Do not engage in 'mercy killings' for fear of starvation," God will provide (17:31)
- Do not commit adultery (17:32)
- Do not kill unjustly (17:33)
- Care for orphaned children (17:34)
- Keep one's promises (17:34)
- Be honest and fair in one's interactions (17:35)
- Do not be arrogant in one's claims or beliefs (17:36-37)

Keep virtues by adopting the virtues of a Muslim listed above`,
    data: {
      membership: { current: 0, previous: 0 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
  "we-believe-in-a-strong-cohesive-community": {
    title: "WE BELIEVE IN A STRONG COHESIVE COMMUNITY",
    date: "March 20, 2025",
    attendees: "",
    content: `The Mountain House Muslim Association is dedicated to its original cause of building a Masjid, a center of excellence that will be recognized far and near. We believe that a Masjid should be the heart of a Muslim community, bustling with activity the whole day, every day of the year.

- A Purpose made prayer hall
- A Maktab, a learning center, producing the next generation of scholars
- A sports facility to attract people of all ages.
- A multipurpose community center, a place where we can all come together

Join us in our effort to build an exemplary facility that will meet the needs of this and many future generations`,
    data: {
      membership: { current: 0, previous: 0 },
      accounts: {
        operations: { current: "$0.00", previous: "$0.00" },
        membership: { current: "$0.00", previous: "$0.00" },
        masjid: { current: "$0.00", previous: "$0.00" },
        zakat: { current: "$0.00", previous: "$0.00" }
      }
    }
  },
};

// Helper function to render markdown-like content
function renderContent(content: string) {
  if (!content) {
    return <p className="text-gray-600">No content available.</p>;
  }
  const lines = content.split('\n');
  const elements = [];
  let currentList = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${i}`} className="list-disc ml-6 mb-4 space-y-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
      continue;
    }
    
    // Check if it's a heading (starts and ends with **)
    if (line.startsWith('**') && line.endsWith('**')) {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${i}`} className="list-disc ml-6 mb-4 space-y-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
      const headingText = line.replace(/\*\*/g, '');
      elements.push(
        <h3 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-3">
          {headingText}
        </h3>
      );
      continue;
    }
    
    // Check if it's a list item
    if (line.startsWith('- ')) {
      currentList.push(line.substring(2));
      continue;
    }
    
    // If we have a list pending, render it first
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${i}`} className="list-disc ml-6 mb-4 space-y-2">
          {currentList.map((item, idx) => (
            <li key={idx} className="text-gray-700">{item}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
    
    // Process inline bold text
    if (line.includes('**')) {
      const parts = line.split(/\*\*/g);
      elements.push(
        <p key={i} className="text-gray-700 mb-4">
          {parts.map((part, idx) => 
            idx % 2 === 1 ? <strong key={idx} className="font-semibold text-gray-900">{part}</strong> : part
          )}
        </p>
      );
    } else {
      // Regular paragraph
      elements.push(
        <p key={i} className="text-gray-700 mb-4">
          {line}
        </p>
      );
    }
  }
  
  // Render any remaining list items
  if (currentList.length > 0) {
    elements.push(
      <ul key="final-list" className="list-disc ml-6 mb-4 space-y-2">
        {currentList.map((item, idx) => (
          <li key={idx} className="text-gray-700">{item}</li>
        ))}
      </ul>
    );
  }
  
  return elements;
}

export default function JournalEntryPage({ params }: { params: { slug: string } }) {
  const [wpEntry, setWpEntry] = useState<JournalEntry | null>(null);
  const [allJournalEntries, setAllJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "http://mhma-update.local/wp-json";

        // Fetch current entry
        const entryResponse = await fetch(`${WP_API_URL}/wp/v2/pages?slug=${params.slug}`);
        if (entryResponse.ok) {
          const data = await entryResponse.json();
          if (data && data.length > 0) {
            setWpEntry(data[0]);
          }
        }

        // Fetch all journal entries for related posts
        const allResponse = await fetch(`${WP_API_URL}/wp/v2/pages?parent=199&per_page=100`);
        if (allResponse.ok) {
          const wpEntries = await allResponse.json();
          const formattedWpEntries = wpEntries.map((entry: JournalEntry) => {
            const datePublished = entry.acf?.date_published;
            const dateHeldOn = entry.acf?.date_held_on;
            let formattedDate = "";
            let rawDate = "";
            if (datePublished) {
              const date = new Date(datePublished);
              formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
              rawDate = datePublished;
            }
            return {
              slug: entry.slug,
              title: entry.acf?.journal_title || entry.title.rendered,
              date: formattedDate,
              rawDate: rawDate,
            };
          });

          // Combine with hardcoded entries
          const hardcodedEntries = Object.entries(journalContent).map(([slug, data]) => ({
            slug,
            title: data.title,
            date: data.date,
            rawDate: data.date,
          }));

          const allEntries = [...formattedWpEntries, ...hardcodedEntries];
          setAllJournalEntries(allEntries);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.slug]);

  const hardcodedEntry = journalContent[params.slug];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="journal" />
        <main className="pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  const entry = wpEntry ? {
    title: wpEntry.acf?.journal_title || wpEntry.title.rendered,
    content: wpEntry.acf?.content || wpEntry.content.rendered,
    datePublished: wpEntry.acf?.date_published ? new Date(wpEntry.acf.date_published).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "",
    dateHeldOn: wpEntry.acf?.date_held_on ? new Date(wpEntry.acf.date_held_on).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "",
    attendees: wpEntry.acf?.attendees || "",
    isHtml: true, // WordPress content is HTML
    data: undefined, // WordPress entries don't have hardcoded data
  } : { ...hardcodedEntry, datePublished: "", dateHeldOn: "", isHtml: false };

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="journal" />
        <main className="pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-900">Journal entry not found</h1>
            <Link href="/journal" className="text-[#c9a227] hover:underline mt-4 inline-block">
              Back to Journal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="journal" />

      <main className="pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/journal" className="text-[#c9a227] hover:underline mb-4 inline-block">
              ← Back to Journal
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{entry.title}</h1>
            {(entry as any).datePublished ? (
              <p className="text-lg text-gray-600">Published On: {(entry as any).datePublished}</p>
            ) : (
              <p className="text-lg text-gray-600">{(entry as any).date || ""}</p>
            )}
            {(entry as any).dateHeldOn && (
              <p className="text-lg text-gray-600">Held On: {(entry as any).dateHeldOn}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="prose prose-lg max-w-none">
              {(entry as any).isImage ? (
                <div className="mt-8">
                  <img
                    src={(entry as any).imageUrl || entry.data?.image}
                    alt={entry.title}
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="text-gray-700 leading-relaxed">
                  {(entry as any).isHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: entry.content }} />
                  ) : (
                    renderContent(entry.content)
                  )}
                </div>
              )}
            </div>

            {!(entry as any).isImage && entry.data && entry.data.image && (
              <div className="mt-8">
                <img
                  src={entry.data.image}
                  alt={entry.title}
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
            )}

            {entry.data && entry.data.membership && (
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  MHMA Data
                </h3>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Membership</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase">Current</p>
                        <p className="text-2xl font-bold text-[#c9a227]">{entry.data.membership.current}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase">Previous</p>
                        <p className="text-2xl font-bold text-gray-700">{entry.data.membership.previous}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Accounts</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Account</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Current</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Previous</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100 hover:bg-white transition-colors">
                            <td className="py-3 px-4 text-gray-700 font-medium">Operations</td>
                            <td className="py-3 px-4 text-right text-[#c9a227] font-semibold">{entry.data.accounts.operations.current}</td>
                            <td className="py-3 px-4 text-right text-gray-600">{entry.data.accounts.operations.previous}</td>
                          </tr>
                          <tr className="border-b border-gray-100 hover:bg-white transition-colors">
                            <td className="py-3 px-4 text-gray-700 font-medium">Membership</td>
                            <td className="py-3 px-4 text-right text-[#c9a227] font-semibold">{entry.data.accounts.membership.current}</td>
                            <td className="py-3 px-4 text-right text-gray-600">{entry.data.accounts.membership.previous}</td>
                          </tr>
                          <tr className="border-b border-gray-100 hover:bg-white transition-colors">
                            <td className="py-3 px-4 text-gray-700 font-medium">Masjid</td>
                            <td className="py-3 px-4 text-right text-[#c9a227] font-semibold">{entry.data.accounts.masjid.current}</td>
                            <td className="py-3 px-4 text-right text-gray-600">{entry.data.accounts.masjid.previous}</td>
                          </tr>
                          <tr className="hover:bg-white transition-colors">
                            <td className="py-3 px-4 text-gray-700 font-medium">Zakat</td>
                            <td className="py-3 px-4 text-right text-[#c9a227] font-semibold">{entry.data.accounts.zakat.current}</td>
                            <td className="py-3 px-4 text-right text-gray-600">{entry.data.accounts.zakat.previous}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {entry.attendees && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Meeting Attendees
                </h3>
                <p className="text-gray-600 leading-relaxed">{entry.attendees}</p>
              </div>
            )}
          </div>

          {/* Related Posts */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Related Posts</h3>
            <div className="grid gap-4">
              {(() => {
                // Get current entry's date for comparison
                const currentEntryDate = (entry as any).datePublished || (entry as any).date || "";
                const currentDateObj = currentEntryDate ? new Date(currentEntryDate.replace("Published On: ", "")) : new Date("1970-01-01");

                // Filter out current entry and sort by date
                const relatedEntries = allJournalEntries
                  .filter((e) => e.slug !== params.slug)
                  .map((e) => ({
                    ...e,
                    dateObj: new Date((e as any).rawDate || "1970-01-01"),
                  }))
                  .sort((a, b) => {
                    // Sort by how close they are to the current entry's date
                    const diffA = Math.abs(a.dateObj.getTime() - currentDateObj.getTime());
                    const diffB = Math.abs(b.dateObj.getTime() - currentDateObj.getTime());
                    return diffA - diffB;
                  })
                  .slice(0, 5);

                return relatedEntries.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/journal/${entry.slug}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200 hover:border-[#c9a227]"
                  >
                    <p className="text-sm text-[#c9a227] font-medium mb-1">{entry.date}</p>
                    <p className="text-gray-900 font-semibold hover:text-[#c9a227] transition-colors">{entry.title}</p>
                  </Link>
                ));
              })()}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Image
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp"
                alt="MHMA Logo"
                width={180}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm">
              © Copyright 2010-2026 | Mountain House Muslim Association
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

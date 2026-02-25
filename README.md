# Defense Attempt Tracker

A simple, fast, and minimalist web application that calculates the number of remaining attempts for various Indian Defense competitive exams based on a candidate's Date of Birth (DOB) and Category.

## Overview
Defense aspirants often struggle to track how many attempts they have left for exams like NDA, CDS, AFCAT, INET, and CAPF because eligibility rules are complex and depend on both age and the specific half of the year the course originates. 

This tracker automates that calculation using the official formula:
> *"Born not earlier than 2nd Jan/July and not later than 1st Jan/July"*

## 🚀 Features
- **Accurate Calculation:** Determines precise eligibility based on official age limits for each exam.
- **Dynamic Last Chances:** Automatically highlights if an aspirant is down to their final chance for any given exam.
- **Category Relaxations:** Supports immediate application of OBC (+3 Years) and SC/ST (+5 Years) age relaxations for exams like CAPF and ICG.
- **Special Exceptions Included:** Factors in specialized age relaxations, such as CPL holders for AFCAT (Flying) and Law Cadre for Navy SSC Tech.
- **Responsive UI:** Clean, minimalist UI built with Tailwind CSS that works seamlessly across mobile, tablet, and desktop screens.

## 🛠️ Supported Exams
- Army TES (10+2)
- Navy 10+2 (B.Tech)
- NDA (National Defence Academy)
- CDS (IMA / INA / AFA / OTA)
- AFCAT (Flying Branch & Ground Duty)
- ICG AC (Indian Coast Guard)
- CAPF AC (Central Armed Police Forces)
- Army SSC Tech & NCC Special
- Navy SSC Tech

## 💻 Tech Stack
This project is built using basic web technologies, making it extremely lightweight and easy to host anywhere:
- **HTML5** (Structure)
- **Tailwind CSS** (via CDN for styling)
- **Vanilla JavaScript** (Logic & DOM Manipulation)


## 📝 Disclaimer
This tool calculates the timeline of attempts purely mathematically based on Date of Birth. Actual eligibility to sit for an exam also heavily depends on **Educational Qualifications, Gender, and Marital Status**. Please always cross-verify with the official notifications released by UPSC, Indian Army, Navy, or Air Force.

---
*Developed by Deepak*

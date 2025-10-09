# Todo List

- [ ] NextAuth - CRM -> Customer -> E-Mail -> Register (Take Care that the Register E-Mail is only sent if the guy is a customer in CRM)
- [ ] Dashboard Landing Page - Upselling (Automations and )
- [ ] Onboarding Guide:
        1. Basic Information (CRM Advantages, Extenability)
        2. Dashboard Guide (Login, Collections, Pages-Collection, Service-Collection, Project-Collection, Categories, Messages, Posts-Collection)
        3. Basic Automations Guide
        4. Custom Automations Guide
        5. Profile Guide
- [ ] Freebies (Checklists, Guides, etc.)
- [ ] Admin-Panel (Assign Roles, Add new Data, Upload Stuff to Blob Store, Overview User Data, Update/Rewrite User Data)


NextAuth Management:
1. If a Lead from CRM gets the Customer Rule -> Send E-Mail to Customer for Registration Process
2. Registration Process over E-Mail with MagicLink (OAUTH / OTP for max. Security)
3. Redirect to Customer Panel Landing Page (Protected Route)
4. If a new Customer is registered, Discord Confirmation Message
5. We need an Option to take care of the password-management process etc.



# Builder

Webhook Trigger 
    ↓
Extract & Validate Input
    ↓
Create NeonDB Branch
    ↓
Fetch Figma File
    ↓
Extract Design Tokens
    ↓
Create Embeddings
    ↓
Query RAG - Component Library
    ↓
Query RAG - Past Generations
    ↓
Query RAG - Brand Guidelines
    ↓
Build Context for Claude
    ↓
Generate Code with Claude
    ↓
Parse Generated Files
    ↓
Create GitHub Branch
    ↓
Commit Files to GitHub
    ↓
Run Migrations on NeonDB Branch
    ↓
Create Vercel Preview Deployment
    ↓
Test Generated Collections
    ↓
[If Tests Pass] → Create Pull Request
    ↓
[If Tests Pass] → Store Success in RAG
    ↓
[If Tests Pass] → Merge NeonDB Branch
    ↓
Send Discord Notification
    ↓
Return Response to Webhook




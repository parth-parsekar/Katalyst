Act as an expert full-stack web developer and UI/UX designer. I want to build a "Unified Learning Tracker" application that helps me track my progress across various platforms like YouTube, W3Schools, and LeetCode etc. 

Please generate the code and architecture for this app based on the following requirements:

1. CORE FEATURES:
- Add a Resource: A form to paste a URL (YouTube video, LeetCode problem, article, etc) with a title and description.
- Custom Segregations: I need to categorize resources using custom tags or folders (e.g., "DSA", "Web Dev", "System Design", "Cloud") etc.
- Status Tracking: Each item should have a state: "To-Do", "In Progress", or "Completed".
- Dashboard: A main view showing active tasks, recently completed items, and a simple progress bar or stat counter.

2. TECH STACK:
- Frontend: React.js with Tailwind CSS.
- Backend: Node.js and Express.js.
- Database: MongoDB (using Mongoose for schemas) or PostgreSQL.
- UI Theme: Dark-mode by default, with a clean, minimalist dashboard layout.

3. DATA SCHEMA REQUIREMENTS:
- A `Resource` model including: ID, Title, URL, Platform (auto-detected if possible, e.g., 'YouTube'), Category/Tag, Status, Date Added, and Date Completed.

4. INSTRUCTIONS FOR YOU:
- Start by providing the database schema and the overall folder structure for the project.
- Next, generate the backend REST API endpoints for full CRUD operations on the resources.
- Finally, provide the React components for the main Dashboard and the "Add Resource" form.
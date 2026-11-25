// Landing Builder: four starting points. Each is a whole page with its own invented product, copy and order.
// Section content lists only what differs from the section's defaults (merged shallowly when a preset loads).
import type { Preset } from "./doc"

const AI_PRODUCT: Preset = {
  id: "ai-product",
  name: "AI product",
  description: "An AI analyst that answers questions about a company's data, with pricing and a full FAQ.",
  doc: {
    brand: { name: "Quarry", accent: "#4338ca", baseUrl: "https://quarry.example" },
    sections: [
      {
        slug: "landing-nav",
        content: {
          links: [
            { label: "Product", href: "#product" },
            { label: "How it works", href: "#how" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ],
          textLink: { label: "Sign in", href: "/login" },
          action: { label: "Try Quarry", href: "/signup" },
        },
      },
      {
        slug: "landing-hero",
        content: {
          eyebrow: "For data and operations teams",
          headline: ["Ask your data.", "See how it answered."],
          description: "Quarry connects to your warehouse and answers questions in plain words, with the chart, the SQL and the tables it used.",
          primaryAction: { label: "Connect a warehouse", href: "/signup" },
          secondaryAction: { label: "See a sample answer", href: "#how" },
          reassurance: "Read-only access. Free for 14 days.",
          proof: ["Works with the warehouse you already run", "Every answer shows its SQL", "Rows never leave your warehouse"],
          mock: {
            agent: "Quarry",
            time: "10:02",
            file: "september-churn.csv",
            fileMeta: "CSV · 12,480 rows",
            message: "Why did churn go up in September?",
            placeholder: "Ask Quarry",
            recordKind: "Answer",
            recordTitle: "September churn",
            rows: [
              { label: "Accounts lost", value: "214" },
              { label: "Change", value: "+38 vs August" },
              { label: "Main cause", value: "Annual renewals" },
            ],
            checked: "Checked against 3 tables",
            steps: ["A question comes in", "Quarry writes the query", "An answer with its sources"],
          },
        },
      },
      {
        slug: "landing-proof",
        content: {
          title: "Questions answered the same day.",
          titleMuted: "Not the next sprint.",
          figures: [
            { value: 4.1, decimals: 1, prefix: "", suffix: " min", label: "Median time from question to shared answer" },
            { value: 71, decimals: 0, prefix: "", suffix: "%", label: "Of answers shared without editing the query" },
            { value: 9, decimals: 0, prefix: "", suffix: " hrs", label: "Of analyst time back each week, per team" },
          ],
          source: "Medians across 60 teams in their first two months on Quarry, 2026.",
          quotes: [
            {
              text: "Our ops leads used to queue questions for the data team. Now they ask Quarry, check the query and bring us the hard ones.",
              name: "Maya Chen",
              role: "Head of data",
              company: "Northwind",
            },
            {
              text: "The SQL under every answer is what sold our finance team. They can see exactly what was counted.",
              name: "Leo Park",
              role: "Operations lead",
              company: "Harbor & Finch",
            },
          ],
        },
      },
      {
        slug: "landing-steps",
        content: {
          id: "how",
          title: "From question to answer.",
          titleMuted: "With the working shown.",
          note: "Quarry reads your schema once, then writes and runs each query itself. You see every step before you share the result.",
          link: { label: "Read how it works", href: "/docs/how-it-works" },
          steps: [
            { title: "Ask in plain words", body: "Type the question the way you would ask a colleague. No table names, no syntax." },
            { title: "Quarry writes the query", body: "It picks the tables, joins them and runs a read-only query in your warehouse." },
            { title: "Check it, then share", body: "Read the SQL, adjust a filter if you need to, and send the chart to your team." },
          ],
          story: {
            inbox: {
              title: "Questions",
              meta: "Northwind",
              from: "Maya Chen",
              subject: "Churn by plan, last 90 days",
              file: "request.txt",
              size: "1 KB",
              time: "10:02",
              earlierFrom: "Leo Park",
              earlierSubject: "Weekly revenue",
              earlierTime: "Mon",
            },
            work: {
              title: "Churn by plan",
              working: "Querying",
              done: "3 tables",
              rows: [
                { label: "Tables", value: "accounts, plans" },
                { label: "Rows read", value: "48,210" },
                { label: "Run time", value: "1.4 s" },
                { label: "Access", value: "Read-only" },
              ],
            },
            approve: { title: "Churn by plan", pending: "Ready to share", approved: "Shared", action: "Share", note: "Shared with the revenue team at 10:06" },
            log: {
              title: "Activity",
              meta: "Today",
              items: [
                { label: "Question from Maya", time: "10:02" },
                { label: "Query written by Quarry", time: "10:03" },
                { label: "Shared with the revenue team", time: "10:06" },
              ],
            },
          },
        },
      },
      {
        slug: "landing-feature-rows",
        content: {
          rows: [
            {
              title: "Every answer\nshows its working.",
              body: "Each reply comes with the query Quarry ran and the tables it read, so anyone on the team can check a number before they repeat it.",
              points: ["The SQL sits under every chart", "Click a figure to see the rows behind it", "Edit the query and rerun it in place"],
              link: { label: "How answers are checked", href: "/docs/answers" },
              mock: "chat",
              mockText: {
                title: "Quarry",
                note: "Northwind",
                question: "Which plan lost the most accounts in September?",
                lines: ["Starter lost 132 accounts, 62% of the total.", "Most were annual renewals that lapsed.", "The query and the tables are attached."],
                placeholder: "Ask a follow-up",
              },
            },
            {
              title: "Reports that\nkeep themselves current.",
              body: "Pin any answer to a report. Quarry reruns the query on a schedule and tells you when a number moves more than you expect.",
              link: { label: "Explore reports", href: "/docs/reports" },
              mock: "report",
              mockText: {
                title: "Weekly revenue",
                note: "Northwind",
                rows: [
                  { label: "New subscriptions", value: 18400 },
                  { label: "Expansion", value: 6250 },
                  { label: "Refunds", value: -1320 },
                  { label: "Churned", value: -4870 },
                ],
                totalLabel: "Net new",
                prefix: "$",
              },
            },
            {
              title: "Ask once.\nGet it every Monday.",
              body: "Turn a question into a routine. Quarry runs it, compares the result with last week and sends a short note to the people who need it.",
              points: ["Runs on a schedule or when you ask", "Flags results that look unusual", "Posts to email or your team chat"],
              link: { label: "See routines", href: "/docs/routines" },
              mock: "list",
              mockText: {
                title: "Monday routine",
                note: "Quarry",
                lines: ["Refresh revenue tables", "Compare with last week", "Flag 2 unusual changes", "Draft the summary", "Send to the revenue team"],
              },
            },
          ],
        },
      },
      {
        slug: "landing-feature-grid",
        content: {
          id: "product",
          title: "Everything an analyst does twice.",
          titleMuted: "Done once, kept current.",
          features: [
            { icon: "database", title: "Read-only by design.", text: "Quarry connects with a read-only role and never writes to your warehouse." },
            { icon: "search", title: "Knows your schema.", text: "It reads table and column names once and learns the words your team uses for them." },
            { icon: "code", title: "SQL you can keep.", text: "Copy any query into your own tools. It is plain SQL, formatted and commented." },
            { icon: "users", title: "Access follows your roles.", text: "People only get answers from tables they can already read in the warehouse." },
            { icon: "bell", title: "Alerts with a reason.", text: "When a number moves, the note says by how much and which rows moved it." },
            { icon: "clock", title: "Runs where the data is.", text: "Queries run in your warehouse, so speed follows your compute, not a queue of ours." },
          ],
          wide: {
            icon: "lock",
            title: "Your rows stay where they are.",
            text: "Quarry sends the question and the schema to the model, never the rows. Results are computed in your warehouse and shown in your browser, and nothing is kept on our side once the session ends.",
          },
        },
      },
      {
        slug: "landing-pricing",
        content: {
          id: "pricing",
          title: "Start free.",
          titleMuted: "Pay per seat as you grow.",
          description: "Every plan includes unlimited questions. Add seats and warehouses when the team needs them, and cancel whenever you like.",
          link: { label: "Compare plans", href: "/pricing" },
          plans: [
            {
              name: "Trial",
              price: 0,
              priceYearly: 0,
              description: "Two weeks with everything, for one person.",
              features: ["One warehouse, read-only", "Unlimited questions", "Saved answers and reports"],
              details: [{ label: "Seats", value: "1" }],
              action: { label: "Start a trial", href: "/signup" },
            },
            {
              name: "Team",
              price: 40,
              priceYearly: 32,
              description: "Per seat, for teams that ask every day.",
              features: ["Up to three warehouses", "Scheduled routines and alerts", "Roles that follow your warehouse", "Shared reports"],
              details: [{ label: "Seats", value: "Billed per person" }],
              action: { label: "Start with Team", href: "/signup?plan=team" },
              featured: true,
            },
            {
              name: "Company",
              price: "Custom",
              description: "For many teams and stricter reviews.",
              features: ["Unlimited warehouses", "Single sign-on and an audit log", "A named contact on our side"],
              details: [{ label: "Seats", value: "Volume pricing" }],
              action: { label: "Talk to us", href: "/contact" },
            },
          ],
        },
      },
      {
        slug: "landing-faq",
        content: {
          id: "faq",
          title: "Before you connect",
          titleMuted: "a warehouse.",
          note: "Something missing? Write to us and a person replies within a day.",
          link: { label: "Contact us", href: "/contact" },
          items: [
            {
              question: "Does Quarry see my data?",
              answer: "Quarry sends your question and your schema to the model, not the rows in your tables. Queries run inside your warehouse with a read-only role, and the results go straight to your browser.",
            },
            {
              question: "Which warehouses does it work with?",
              answer: "Most SQL warehouses and Postgres databases. The setup page tests the connection before you start, so you know within a minute.",
            },
            {
              question: "What if an answer is wrong?",
              answer: "Every answer shows its query, so you can see exactly what was counted.\n\nFix a filter in place and Quarry keeps the correction for the next person who asks.",
            },
            {
              question: "Can I control who sees what?",
              answer: "Quarry uses the permissions your warehouse already has. If someone cannot read a table there, they cannot get answers from it here.",
            },
            {
              question: "How long does setup take?",
              answer: "About ten minutes: create a read-only user, paste the connection details, and ask a first question while Quarry reads the schema.",
            },
          ],
        },
      },
      {
        slug: "landing-cta",
        content: {
          headline: ["Ask the question", "you have been putting off."],
          description: "Connect a warehouse with a read-only user and get your first answer in about ten minutes.",
          primaryAction: { label: "Connect a warehouse", href: "/signup" },
          secondaryAction: { label: "Book a walkthrough", href: "/demo" },
          reassurance: "Free for 14 days. No card needed.",
          links: [
            { label: "Security", href: "/security" },
            { label: "Docs", href: "/docs" },
            { label: "Changelog", href: "/changelog" },
          ],
          mock: {
            title: "Getting started",
            done: "Ready",
            rows: [
              { label: "Create a read-only user", detail: "About 2 minutes" },
              { label: "Paste the connection", detail: "Quarry tests it first" },
              { label: "Ask a first question", detail: "The answer shows its query" },
            ],
          },
        },
      },
      {
        slug: "landing-footer",
        content: {
          description: "Answers from your data, with the working shown.",
          socials: [
            { kind: "x", href: "#x" },
            { kind: "github", href: "#github" },
            { kind: "linkedin", href: "#linkedin" },
            { kind: "mail", href: "mailto:hello@quarry.example" },
          ],
          columns: [
            {
              title: "Product",
              links: [
                { label: "Overview", href: "#product" },
                { label: "How it works", href: "#how" },
                { label: "Pricing", href: "#pricing" },
                { label: "Changelog", href: "/changelog" },
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "Docs", href: "/docs" },
                { label: "Guides", href: "/guides" },
                { label: "Security", href: "/security" },
                { label: "Status", href: "/status" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "/about" },
                { label: "Careers", href: "/careers" },
                { label: "Contact", href: "/contact" },
              ],
            },
          ],
          copyright: "© 2026 Quarry Labs, Inc.",
          legal: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ],
        },
      },
    ],
  },
}

const DEVELOPER_TOOL: Preset = {
  id: "developer-tool",
  name: "Developer tool",
  description: "Preview environments for every pull request, in ink with a soft hero panel and a pricing teaser.",
  doc: {
    brand: { name: "Tern", accent: "#27272a", baseUrl: "https://tern.example" },
    sections: [
      {
        slug: "landing-nav",
        content: {
          links: [
            { label: "Product", href: "#features" },
            { label: "Docs", href: "/docs" },
            { label: "Pricing", href: "#pricing" },
            { label: "Changelog", href: "/changelog" },
          ],
          textLink: { label: "Sign in", href: "/login" },
          action: { label: "Get started", href: "/signup" },
        },
      },
      {
        slug: "landing-hero",
        content: {
          panel: "soft",
          eyebrow: "Preview environments",
          headline: ["Every branch,", "live with real data."],
          description: "Tern builds each branch with a masked copy of your production database, so reviewers click through the change instead of reading about it.",
          primaryAction: { label: "Connect a repository", href: "/signup" },
          secondaryAction: { label: "Read the docs", href: "/docs" },
          reassurance: "Free for public repositories and your first 100 previews.",
          proof: ["Ready in about 90 seconds", "Personal data masked by default", "Removed when the branch merges"],
          mock: {
            agent: "Tern",
            time: "14:20",
            file: "pull-482.diff",
            fileMeta: "Diff · 14 files",
            message: "Preview for “Move billing to the new API”",
            placeholder: "Comment on the preview",
            recordKind: "Preview",
            recordTitle: "Pull request 482",
            rows: [
              { label: "Branch", value: "billing-api" },
              { label: "Database", value: "Masked copy, 2.1 GB" },
              { label: "Ready in", value: "84 seconds" },
            ],
            checked: "Migrations ran without errors",
            steps: ["A pull request opens", "Tern builds the branch", "A preview to click through"],
          },
        },
      },
      {
        slug: "landing-steps",
        content: {
          title: "Open a pull request.",
          titleMuted: "Get a link to the running app.",
          note: "Tern watches your repository. Each new branch gets its own build, database and address, posted as a comment on the pull request.",
          link: { label: "See an example preview", href: "/demo" },
          steps: [
            { title: "Push a branch", body: "Open a pull request as usual. Tern picks it up and builds from your existing Dockerfile." },
            { title: "Tern builds it", body: "It restores a masked database snapshot, runs your migrations and starts the app." },
            { title: "Review the real thing", body: "Reviewers open the link, try the change and comment where they found an issue." },
          ],
          story: {
            inbox: {
              title: "Pull requests",
              meta: "northwind/app",
              from: "Rosa Diaz",
              subject: "Move billing to the new API",
              file: "#482",
              size: "14 files",
              time: "14:20",
              earlierFrom: "Leo Park",
              earlierSubject: "Fix the date filter",
              earlierTime: "Tue",
            },
            work: {
              title: "Preview 482",
              working: "Building",
              done: "Ready",
              rows: [
                { label: "Image", value: "Built in 52 s" },
                { label: "Database", value: "Restored, masked" },
                { label: "Migrations", value: "4 applied" },
                { label: "Address", value: "pr-482.preview" },
              ],
            },
            approve: { title: "Preview 482", pending: "In review", approved: "Approved", action: "Approve", note: "Approved by Leo at 14:41" },
            log: {
              title: "Activity",
              meta: "Today",
              items: [
                { label: "Opened by Rosa", time: "14:20" },
                { label: "Preview ready", time: "14:22" },
                { label: "Approved by Leo", time: "14:41" },
              ],
            },
          },
        },
      },
      {
        slug: "landing-feature-rows",
        content: {
          start: "media-left",
          rows: [
            {
              title: "Data that looks real.\nNone of it is.",
              body: "Tern copies your schema and a sample of rows, then replaces names, emails and card numbers with consistent fakes before anything reaches a preview.",
              points: ["Masking rules live in your repository", "The same person always masks to the same fake", "Snapshots refresh every night"],
              link: { label: "Masking rules", href: "/docs/masking" },
              mock: "list",
              mockText: {
                title: "Nightly snapshot",
                note: "Tern",
                lines: ["Copy the schema", "Sample 5% of rows", "Mask 12 personal columns", "Check foreign keys", "Publish the snapshot"],
              },
            },
            {
              title: "Costs you can predict.\nNo idle servers.",
              body: "Previews sleep after twenty minutes without a visit and wake on the next request. When the branch merges, everything is removed.",
              link: { label: "How sleeping works", href: "/docs/sleep" },
              mock: "report",
              mockText: {
                title: "This month",
                note: "northwind/app",
                rows: [
                  { label: "Build minutes", value: 142 },
                  { label: "Running time", value: 96 },
                  { label: "Snapshot storage", value: 18 },
                  { label: "Open-source credit", value: -40 },
                ],
                totalLabel: "Total",
                prefix: "$",
              },
            },
          ],
        },
      },
      {
        slug: "landing-feature-grid",
        content: {
          id: "features",
          title: "The parts you would build yourself.",
          titleMuted: "Already done.",
          features: [
            { icon: "code", title: "Uses your Dockerfile.", text: "No new config format. Tern builds what you already ship, with a cache between commits." },
            { icon: "database", title: "A database per branch.", text: "Each preview gets its own copy, so one reviewer's test data never shows up in another's." },
            { icon: "key", title: "Secrets stay scoped.", text: "Previews get their own keys, never production ones, set once per repository." },
            { icon: "lock", title: "Private by default.", text: "Preview links ask for a team sign-in unless you choose to share one." },
            { icon: "workflow", title: "Fits your checks.", text: "Run end-to-end tests against the preview and report back as a status on the pull request." },
            { icon: "settings", title: "One file to tune.", text: "Sleep times, masking rules and machine size live in tern.toml next to your code." },
          ],
          wide: null,
        },
      },
      {
        slug: "landing-pricing",
        content: {
          id: "pricing",
          layout: "teaser",
          title: "Free to start.",
          titleMuted: "Then pay for what runs.",
          description: "Public repositories are free. Private ones pay per seat plus build and running time, billed by the minute, with a monthly cap you set.",
          link: { label: "See the pricing details", href: "/pricing" },
          billing: false,
          plans: [
            {
              name: "Team",
              price: 20,
              description: "Per seat, for private repositories.",
              features: ["Unlimited previews", "Masked database snapshots", "Team sign-in on every link"],
              details: [{ label: "Usage", value: "From $0.02 a minute" }],
              action: { label: "Start free", href: "/signup" },
              featured: true,
            },
          ],
        },
      },
      {
        slug: "landing-faq",
        content: {
          id: "faq",
          title: "Questions from engineers.",
          note: "Not here? The docs cover setup for most stacks.",
          link: { label: "Read the docs", href: "/docs" },
          items: [
            {
              question: "Do I need to change my build?",
              answer: "No. If your app builds from a Dockerfile, Tern can run it. A short tern.toml sets the port, the database and how long previews stay awake.",
            },
            {
              question: "How is production data protected?",
              answer: "Snapshots are made inside your own cloud account. Masking runs there before a snapshot is published, so personal data never leaves your infrastructure unmasked.",
            },
            {
              question: "Which databases are supported?",
              answer: "Postgres and MySQL today. Other services start empty, or from a seed script you provide.",
            },
            {
              question: "What happens when a branch merges?",
              answer: "The preview, its database and its address are removed within a minute. Logs are kept for seven days in case you need them.",
            },
            {
              question: "Can previews run our test suite?",
              answer: "Yes. Tern reports a status check when a preview is ready, so your end-to-end tests can start against its address.",
            },
          ],
        },
      },
      {
        slug: "landing-cta",
        content: {
          tone: "ink",
          headline: ["Review the running app,", "not the diff."],
          description: "Connect a repository and your next pull request gets a preview with real-looking data in about 90 seconds.",
          primaryAction: { label: "Connect a repository", href: "/signup" },
          secondaryAction: { label: "Read the docs", href: "/docs" },
          reassurance: "Free for public repositories.",
          links: [
            { label: "Security", href: "/security" },
            { label: "Status", href: "/status" },
            { label: "Changelog", href: "/changelog" },
          ],
          mock: {
            title: "First preview",
            done: "Live",
            rows: [
              { label: "Connect a repository", detail: "Read access to code" },
              { label: "Add tern.toml", detail: "Port, database, sleep time" },
              { label: "Open a pull request", detail: "The link arrives as a comment" },
            ],
          },
        },
      },
      {
        slug: "landing-footer",
        content: {
          description: "Preview environments with real-looking data.",
          socials: [
            { kind: "github", href: "#github" },
            { kind: "x", href: "#x" },
            { kind: "discord", href: "#discord" },
            { kind: "rss", href: "/changelog.xml" },
          ],
          columns: [
            {
              title: "Product",
              links: [
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Changelog", href: "/changelog" },
                { label: "Status", href: "/status" },
              ],
            },
            {
              title: "Docs",
              links: [
                { label: "Getting started", href: "/docs" },
                { label: "tern.toml", href: "/docs/config" },
                { label: "Masking", href: "/docs/masking" },
                { label: "CLI", href: "/docs/cli" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Contact", href: "/contact" },
              ],
            },
          ],
          copyright: "© 2026 Tern Systems",
          legal: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Security", href: "/security" },
          ],
        },
      },
    ],
  },
}

const AGENCY: Preset = {
  id: "agency",
  name: "Agency or service",
  description: "A small design and engineering studio: who it is for, how it works, fixed prices and a booking call.",
  doc: {
    brand: { name: "Harbor & Finch", accent: "#b4532a", baseUrl: "https://harborfinch.example" },
    sections: [
      {
        slug: "landing-nav",
        content: {
          links: [
            { label: "Services", href: "#services" },
            { label: "Process", href: "#process" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ],
          textLink: { label: "Email us", href: "mailto:hello@harborfinch.example" },
          action: { label: "Book a call", href: "/call" },
        },
      },
      {
        slug: "landing-hero",
        content: {
          panel: "soft",
          eyebrow: "Design and engineering studio",
          headline: ["A better site", "in six weeks."],
          description: "We are a team of four who write, design and build marketing sites for software companies, from the first interview to the deploy.",
          primaryAction: { label: "Book an intro call", href: "/call" },
          secondaryAction: { label: "See how we work", href: "#process" },
          reassurance: "Fixed price, agreed before we start.",
          proof: ["Two projects at a time, never more", "You own the code and the design files", "A month of fixes included"],
          mock: {
            agent: "Maya",
            time: "11:30",
            file: "homepage-round-2.pdf",
            fileMeta: "PDF · 8 pages",
            message: "Round two of the homepage is ready for your comments.",
            placeholder: "Reply to Maya",
            recordKind: "Milestone",
            recordTitle: "Homepage design",
            rows: [
              { label: "Week", value: "3 of 6" },
              { label: "Status", value: "Ready for review" },
              { label: "Next", value: "Build starts Monday" },
            ],
            checked: "Signed off by both sides",
            steps: ["A draft is shared", "Your comments are taken in", "A signed-off milestone"],
          },
        },
      },
      {
        slug: "landing-audience",
        content: {
          title: "For founders",
          titleMuted: "and the teams who ship with them.",
          note: "We work alongside your people, in your tools, not in a separate room.",
          audiences: [
            {
              label: "For founders",
              promise: "A site that explains the product the way you do.",
              points: ["We interview you and two customers first", "You review the words before any design", "Launch with measurement already set up"],
              link: { label: "Founder projects", href: "/work/founders" },
            },
            {
              label: "For product and marketing teams",
              promise: "A system your team can keep editing.",
              points: ["Built on your stack and documented as we go", "A component library for the next launch", "Handover sessions for whoever maintains it"],
              link: { label: "Team projects", href: "/work/teams" },
            },
          ],
        },
      },
      {
        slug: "landing-steps",
        content: {
          id: "process",
          title: "Six weeks,",
          titleMuted: "three checkpoints.",
          note: "Every two weeks you get something to click through and a short list of decisions. Nothing moves on until you sign it off.",
          link: { label: "Read our process", href: "/process" },
          steps: [
            { title: "Words first", body: "We interview you and your customers, then write the page before anything is designed." },
            { title: "Then the design", body: "Two directions, one chosen, then every page drawn at phone and desktop size." },
            { title: "Then the build", body: "We build it on your stack, test it on real devices and launch it with you." },
          ],
          story: {
            inbox: {
              title: "Inbox",
              meta: "Harbor & Finch",
              from: "Northwind",
              subject: "Homepage brief",
              file: "brief.pdf",
              size: "220 KB",
              time: "09:12",
              earlierFrom: "Sage Health",
              earlierSubject: "Launch checklist",
              earlierTime: "Fri",
            },
            work: {
              title: "Homepage",
              working: "Drafting",
              done: "6 pages",
              rows: [
                { label: "Pages", value: "6" },
                { label: "Sizes", value: "Phone, desktop" },
                { label: "Copy", value: "Approved" },
                { label: "Lead", value: "Maya" },
              ],
            },
            approve: { title: "Homepage", pending: "For sign-off", approved: "Signed off", action: "Sign off", note: "Signed off by Northwind at 16:20" },
            log: {
              title: "Milestones",
              meta: "Week 6",
              items: [
                { label: "Words approved", time: "Week 2" },
                { label: "Design signed off", time: "Week 4" },
                { label: "Site launched", time: "Week 6" },
              ],
            },
          },
        },
      },
      {
        slug: "landing-feature-grid",
        content: {
          id: "services",
          title: "What we do.",
          titleMuted: "And what we hand over.",
          features: [
            { icon: "file", title: "Positioning and copy.", text: "Interviews, a message map and every word on the page, written before the design." },
            { icon: "layers", title: "A small design system.", text: "Pages built from a few components your team can reuse for the next launch." },
            { icon: "code", title: "Front-end build.", text: "Fast, accessible pages on the framework you already use, reviewed like your own code." },
            { icon: "chart", title: "Measurement.", text: "Events and goals set up before launch, so the first week's numbers mean something." },
            { icon: "search", title: "Search basics.", text: "Clean structure, titles and link previews for every page, checked before it goes live." },
            { icon: "users", title: "Handover.", text: "A recorded walkthrough and written notes for whoever edits the site after us." },
          ],
          wide: {
            icon: "calendar",
            title: "A month of fixes after launch.",
            text: "Anything that breaks or reads wrong in the first month, we fix at no charge. After that, keep us on a small monthly plan or take it from here; either way you own everything we made.",
          },
        },
      },
      {
        slug: "landing-pricing",
        content: {
          id: "pricing",
          title: "Fixed prices.",
          titleMuted: "Agreed before we start.",
          description: "Each engagement has a written scope and price. If the scope changes, we agree the change in writing first.",
          link: { label: "Ask about a custom scope", href: "/call" },
          billing: false,
          plans: [
            {
              name: "Launch page",
              price: 9500,
              unit: "per project",
              description: "One page, written, designed and built in three weeks.",
              features: ["Interviews and copy", "Design at phone and desktop size", "Built on your stack", "Two rounds of changes"],
              details: [{ label: "Timeline", value: "3 weeks" }],
              action: { label: "Book a call", href: "/call" },
            },
            {
              name: "Product site",
              price: 24000,
              unit: "per project",
              description: "Up to eight pages and a component library.",
              features: ["Everything in Launch page", "Up to eight pages", "A reusable component library", "Measurement set up"],
              details: [{ label: "Timeline", value: "6 weeks" }],
              action: { label: "Book a call", href: "/call" },
              featured: true,
            },
            {
              name: "Ongoing",
              price: 3200,
              description: "A few days a month for new pages and changes.",
              features: ["New pages as you need them", "Fixes within two working days", "A monthly speed and search check"],
              details: [{ label: "Commitment", value: "Three months" }],
              action: { label: "Ask about Ongoing", href: "/call" },
            },
          ],
        },
      },
      {
        slug: "landing-faq",
        content: {
          id: "faq",
          title: "Before you book.",
          note: "Rather talk it through? Book a 30-minute call. There is no pitch.",
          link: { label: "Book a call", href: "/call" },
          items: [
            {
              question: "How soon can you start?",
              answer: "We take on two projects at a time, so there is usually a two to four week wait. You get an exact start date on the first call.",
            },
            {
              question: "Do you work with our developers?",
              answer: "Yes, and we prefer it. We build in your repository, follow your review process and leave code your team is happy to own.",
            },
            {
              question: "What do you need from us?",
              answer: "An hour for the kickoff, a few customers we can interview, and someone who can make decisions within a couple of days at each checkpoint.",
            },
            {
              question: "What if we need changes after launch?",
              answer: "The first month of fixes is included. After that you can keep us on the Ongoing plan or hand it to your team; you own the code and the design files.",
            },
          ],
        },
      },
      {
        slug: "landing-cta",
        content: {
          headline: ["Have a launch coming up?", "Let's look at it together."],
          description: "Tell us what you are launching and when. We reply within a day with a rough scope and a start date.",
          primaryAction: { label: "Book an intro call", href: "/call" },
          secondaryAction: { label: "Email us", href: "mailto:hello@harborfinch.example" },
          reassurance: "30 minutes, no pitch deck.",
          links: [
            { label: "Process", href: "#process" },
            { label: "Pricing", href: "#pricing" },
            { label: "About us", href: "/about" },
          ],
          mock: {
            title: "Next steps",
            done: "Booked",
            rows: [
              { label: "Intro call", detail: "30 minutes, this week" },
              { label: "Scope and price", detail: "In writing within two days" },
              { label: "Start date", detail: "Agreed before you sign" },
            ],
          },
        },
      },
      {
        slug: "landing-footer",
        content: {
          description: "A small studio for product sites and launch pages.",
          socials: [
            { kind: "linkedin", href: "#linkedin" },
            { kind: "instagram", href: "#instagram" },
            { kind: "mail", href: "mailto:hello@harborfinch.example" },
          ],
          columns: [
            {
              title: "Studio",
              links: [
                { label: "Services", href: "#services" },
                { label: "Process", href: "#process" },
                { label: "Pricing", href: "#pricing" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "/about" },
                { label: "Journal", href: "/journal" },
                { label: "Contact", href: "/contact" },
              ],
            },
          ],
          copyright: "© 2026 Harbor & Finch Studio",
          legal: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ],
        },
      },
    ],
  },
}

const WAITLIST: Preset = {
  id: "waitlist",
  name: "Waitlist",
  description: "A short page for a product that is not open yet: centred hero, three features, a few answers, one ask.",
  doc: {
    brand: { name: "Morrow", accent: "#0f766e", baseUrl: "https://morrow.example" },
    sections: [
      {
        slug: "landing-nav",
        content: {
          links: [
            { label: "Features", href: "#features" },
            { label: "FAQ", href: "#faq" },
          ],
          textLink: null,
          action: { label: "Join the waitlist", href: "#join" },
        },
      },
      {
        slug: "landing-hero",
        content: {
          layout: "centered",
          panel: "soft",
          eyebrow: "Opening in spring 2027",
          headline: ["Your day, in one list.", "Made from your inbox."],
          description: "Morrow reads your mail and calendar each morning and proposes a plan you can change in a minute. Nothing is sent or moved without you.",
          primaryAction: { label: "Join the waitlist", href: "#join" },
          secondaryAction: null,
          reassurance: "We write once, when your invite is ready.",
          proof: ["Works with the mail and calendar you use", "Your mail is read on your device"],
          mock: {
            agent: "Morrow",
            time: "07:45",
            file: "today.ics",
            fileMeta: "Calendar · 6 events",
            message: "Here is a first plan for today.",
            placeholder: "Ask Morrow to move something",
            recordKind: "Plan",
            recordTitle: "Thursday",
            rows: [
              { label: "Focus", value: "09:00 – 11:00" },
              { label: "Replies", value: "4 that need you" },
              { label: "Meetings", value: "3, the last at 16:30" },
            ],
            checked: "Nothing moved without your say",
            steps: ["Morning mail arrives", "Morrow drafts a plan", "A day you approved"],
          },
        },
      },
      {
        slug: "landing-feature-grid",
        content: {
          id: "features",
          title: "Less sorting.",
          titleMuted: "More of the day left.",
          features: [
            { icon: "mail", title: "Mail sorted by what it needs.", text: "Replies, newsletters and notifications are split out, so the few that need you sit at the top." },
            { icon: "calendar", title: "Meetings with room around them.", text: "Morrow keeps a buffer before each meeting and protects a block for focused work." },
            { icon: "lock", title: "Private on your device.", text: "Your mail is read where it already lives. We never store it on our servers." },
          ],
          wide: null,
        },
      },
      {
        slug: "landing-faq",
        content: {
          id: "faq",
          title: "Questions so far.",
          note: "Ask us anything at hello@morrow.example.",
          link: null,
          items: [
            {
              question: "When does it open?",
              answer: "We invite people in small groups from spring 2027. The waitlist sets the order, and we email you once, when it is your turn.",
            },
            {
              question: "What will it cost?",
              answer: "There will be a free plan for one account and a paid plan for several. People on the waitlist get their first paid year at half price.",
            },
            {
              question: "Which mail and calendar apps does it work with?",
              answer: "Any account that supports standard mail and calendar protocols, which covers most providers.",
            },
            {
              question: "Do you read my email?",
              answer: "Morrow reads it on your device to build the plan. Nothing is uploaded to our servers, and you can remove access at any time.",
            },
          ],
        },
      },
      {
        slug: "landing-cta",
        content: {
          id: "join",
          layout: "centered",
          headline: ["Get an invite", "when Morrow opens."],
          description: "Leave your email and we will write once, when your invite is ready. No newsletter.",
          primaryAction: { label: "Join the waitlist", href: "/waitlist" },
          secondaryAction: null,
          reassurance: "One email, when it is your turn.",
          links: [],
        },
      },
      {
        slug: "landing-footer",
        content: {
          description: "A calm plan for the day, opening spring 2027.",
          socials: [
            { kind: "x", href: "#x" },
            { kind: "mail", href: "mailto:hello@morrow.example" },
          ],
          columns: [
            {
              title: "Morrow",
              links: [
                { label: "Features", href: "#features" },
                { label: "FAQ", href: "#faq" },
                { label: "Waitlist", href: "#join" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "/about" },
                { label: "Press", href: "/press" },
                { label: "Contact", href: "mailto:hello@morrow.example" },
              ],
            },
          ],
          copyright: "© 2026 Morrow",
          legal: [{ label: "Privacy", href: "/privacy" }],
        },
      },
    ],
  },
}

export const PRESETS: Preset[] = [AI_PRODUCT, DEVELOPER_TOOL, AGENCY, WAITLIST]
export const DEFAULT_PRESET = AI_PRODUCT

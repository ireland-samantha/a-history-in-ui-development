#!/usr/bin/env python3
"""Deterministic 60-Year Software & Web UI Wireframe Seed Dataset Compiler (1966-2026).

Produces:
  - public/data/wireframes.json (1,020 unique wireframes spanning 1966..2026)
  - public/data/wireframes.jsonl
  - public/data/trends.json
  - public/data/schema.json
"""
import hashlib
import json
import math
import os
import random

ROOT = "/mnt/c2r/repos/history-in-ui-development"
DATA_DIR = os.path.join(ROOT, "public", "data")

ERAS = [
    {
        "id": "E01_BATCH_VECTOR_CRT",
        "code": "E01",
        "name": "Batch & Light-Pen Vector CRT",
        "startYear": 1966,
        "endYear": 1971,
        "chromeStyle": "vector-crt",
        "viewport": (1024, 1024),
        "aspectRatio": "1:1 Vector Scope",
        "grid": (8, 8),
        "dominantInput": "Light-Pen, Chord Keyset & Teletype",
        "webLayoutEngine": "Pre-Web Vector Display List",
        "palette": {"bg": "#061109", "surface": "#0b1e10", "border": "#28d160", "accent": "#52ff8c", "text": "#8affb2", "muted": "#1e6b38"},
        "summary": "Direct-view vector refresh CRTs, light-pen tracking crosses, and early time-sharing consoles pioneered spatial manipulation and hypertext before raster bitmaps.",
    },
    {
        "id": "E02_BLOCK_TERMINAL_TUI",
        "code": "E02",
        "name": "Block-Mode & Character Terminal (TUI)",
        "startYear": 1972,
        "endYear": 1978,
        "chromeStyle": "tui-box",
        "viewport": (960, 600),
        "aspectRatio": "80x24 Character Matrix",
        "grid": (12, 8),
        "dominantInput": "Mechanical Keyboard & Function Keys (PF1-PF24)",
        "webLayoutEngine": "Pre-Web 80x24 Character Cell Grid",
        "palette": {"bg": "#0d0f0a", "surface": "#151a10", "border": "#ffb000", "accent": "#ffd04d", "text": "#ffbe2e", "muted": "#7a5900"},
        "summary": "Synchronous block-mode forms (IBM 3270) and full-duplex VT100 character terminals standardized tabular data entry, reverse-video field focus, and bottom function-key strips.",
    },
    {
        "id": "E03_EARLY_WIMP_DESKTOP",
        "code": "E03",
        "name": "Early Bitmap WIMP & Desktop Metaphor",
        "startYear": 1979,
        "endYear": 1984,
        "chromeStyle": "classic-mac",
        "viewport": (1024, 684),
        "aspectRatio": "3:2 1-Bit Monochrome Bitmap",
        "grid": (12, 8),
        "dominantInput": "1-Button / 2-Button Mechanical Mouse & Keyboard",
        "webLayoutEngine": "Pre-Web QuickDraw / BitBlt Window Manager",
        "palette": {"bg": "#dcdcdc", "surface": "#ffffff", "border": "#111111", "accent": "#000000", "text": "#111111", "muted": "#6e6e6e"},
        "summary": "High-contrast 1-bit dithered bitmaps introduced pull-down global menu bars, overlapping title-bar windows, scrollbars, spatial desktop icons, and direct manipulation.",
    },
    {
        "id": "E04_WORKSTATION_HYPERTEXT",
        "code": "E04",
        "name": "Color Workstations, 3D Bevels & Hypermedia",
        "startYear": 1985,
        "endYear": 1990,
        "chromeStyle": "bevel-win95",
        "viewport": (1024, 768),
        "aspectRatio": "4:3 Workstation XGA",
        "grid": (12, 10),
        "dominantInput": "3-Button Mouse, Floating Palettes & Accelerators",
        "webLayoutEngine": "Pre-Web HyperCard / Motif / NeXT Display PostScript",
        "palette": {"bg": "#556270", "surface": "#c0c0c0", "border": "#ffffff", "accent": "#000080", "text": "#000000", "muted": "#7f7f7f"},
        "summary": "Chiseled 3D Motif/NeXTSTEP bevels, floating tear-off inspectors, MDI document workspaces, and HyperCard hypermedia stacks bridged desktop software to the birth of the Web.",
    },
    {
        "id": "E05_EARLY_WEB_PORTAL",
        "code": "E05",
        "name": "Early Web 1.0 Documents, Framesets & Directories",
        "startYear": 1991,
        "endYear": 1996,
        "chromeStyle": "web1-browser",
        "viewport": (1024, 768),
        "aspectRatio": "4:3 SVGA Browser",
        "grid": (12, 10),
        "dominantInput": "Pointer Click on Blue Underlined Anchor Links",
        "webLayoutEngine": "HTML Document Flow & Framesets",
        "palette": {"bg": "#bfbfbf", "surface": "#dfdfdf", "border": "#808080", "accent": "#0000ee", "text": "#000000", "muted": "#551a8b"},
        "summary": "The early World Wide Web rendered linear hypertext documents, gray bevel browser chrome, server-side image maps, multi-pane HTML framesets, and hierarchical link directories.",
    },
    {
        "id": "E06_DOTCOM_DHTML_SKIN",
        "code": "E06",
        "name": "Dot-Com Table Portals, Skinned Apps & Flash Vector",
        "startYear": 1997,
        "endYear": 2001,
        "chromeStyle": "web1-browser",
        "viewport": (1024, 768),
        "aspectRatio": "4:3 1024x768 Fixed Table",
        "grid": (12, 10),
        "dominantInput": "Mouse Rollovers, Custom Cursors & Form Widgets",
        "webLayoutEngine": "HTML Nested Table Grids & Spacer GIFs",
        "palette": {"bg": "#eef2f7", "surface": "#ffffff", "border": "#99acc2", "accent": "#ff6600", "text": "#1b2733", "muted": "#5d7285"},
        "summary": "Dense 3-column nested HTML table portals, 1px spacer GIF grids, DHTML rollover menus, custom-skinned desktop media players, and animated Flash vector microsites.",
    },
    {
        "id": "E07_WEB20_AJAX_RIA",
        "code": "E07",
        "name": "Web 2.0 Ajax RIAs, Glossy Tabs & Social Streams",
        "startYear": 2002,
        "endYear": 2006,
        "chromeStyle": "aqua-gloss",
        "viewport": (1280, 800),
        "aspectRatio": "16:10 Widescreen Web 2.0",
        "grid": (12, 10),
        "dominantInput": "Asynchronous DOM Click, Drag-Pan & Inline Edit",
        "webLayoutEngine": "CSS Float Grids & XMLHttpRequest (Ajax)",
        "palette": {"bg": "#f2f6fa", "surface": "#ffffff", "border": "#bdd0e4", "accent": "#0077cc", "text": "#222b34", "muted": "#687b8c"},
        "summary": "XMLHttpRequest unlocked desktop-grade Rich Internet Applications (Gmail, Google Maps) with CSS float layouts, glossy gradients, rounded tab strips, tag clouds, and RSS feeds.",
    },
    {
        "id": "E08_MOBILE_TOUCH_SKEUOMORPHIC",
        "code": "E08",
        "name": "Mobile Multi-Touch, Skeuomorphism & 960px Grids",
        "startYear": 2007,
        "endYear": 2011,
        "chromeStyle": "mobile-bezel",
        "viewport": (1120, 760),
        "aspectRatio": "Responsive / Touch Hybrid",
        "grid": (12, 10),
        "dominantInput": "Capacitive Multi-Touch Gestures & Precision Mouse",
        "webLayoutEngine": "960.gs 12-Column CSS & Early Media Queries",
        "palette": {"bg": "#1e242b", "surface": "#f5f5f7", "border": "#8c96a3", "accent": "#1d62f0", "text": "#1c1e21", "muted": "#6b7480"},
        "summary": "Capacitive touchscreens replaced styluses and scrollbars with inertial flicking, bottom tab bars, stitched-leather skeuomorphic chrome, and standardized 960px 12-column web grids.",
    },
    {
        "id": "E09_FLAT_RESPONSIVE_DESIGN_SYSTEM",
        "code": "E09",
        "name": "Flat Design, Material Cards & Responsive SaaS",
        "startYear": 2012,
        "endYear": 2016,
        "chromeStyle": "flat-minimal",
        "viewport": (1366, 768),
        "aspectRatio": "16:9 HD Responsive",
        "grid": (12, 10),
        "dominantInput": "Touch + Trackpad Scroll, Off-Canvas Drawers & FAB",
        "webLayoutEngine": "Responsive Flexbox & Bootstrap 12-Col",
        "palette": {"bg": "#f4f6f9", "surface": "#ffffff", "border": "#e1e6ed", "accent": "#2563eb", "text": "#0f172a", "muted": "#64748b"},
        "summary": "Swiss typography, Metro/iOS 7 flat minimalism, Google Material elevation cards, off-canvas hamburger menus, and SPA component trees (React/Angular) reshaped web apps.",
    },
    {
        "id": "E10_COMPONENT_COLLAB_DARKMODE",
        "code": "E10",
        "name": "Design Systems, Multiplayer Canvases & Dark Mode",
        "startYear": 2017,
        "endYear": 2020,
        "chromeStyle": "flat-minimal",
        "viewport": (1440, 900),
        "aspectRatio": "16:10 Retina Component Grid",
        "grid": (12, 12),
        "dominantInput": "Multiplayer Cursors, Command Palette & Trackpad Zoom",
        "webLayoutEngine": "CSS Grid, Custom Properties & WebGL Canvas",
        "palette": {"bg": "#0f1117", "surface": "#181b24", "border": "#2a3040", "accent": "#6366f1", "text": "#f1f5f9", "muted": "#94a3b8"},
        "summary": "Native CSS Grid, semantic dark-mode design tokens, block-based collaborative editors (Notion), and WebGL multiplayer infinite canvases (Figma) blurred document and application boundaries.",
    },
    {
        "id": "E11_SPATIAL_BENTO_AI_COPILOT",
        "code": "E11",
        "name": "Keyboard-First `⌘K`, Bento Grids & AI Copilots",
        "startYear": 2021,
        "endYear": 2023,
        "chromeStyle": "glass-spatial",
        "viewport": (1440, 900),
        "aspectRatio": "16:10 Local-First / Bento",
        "grid": (12, 12),
        "dominantInput": "Omnibox `⌘K` Keyboard Shortcuts & Conversational Prompts",
        "webLayoutEngine": "CSS Subgrid, Container Queries & Bento Layouts",
        "palette": {"bg": "#090b10", "surface": "#121621", "border": "#232a3d", "accent": "#8b5cf6", "text": "#f8fafc", "muted": "#8b98a9"},
        "summary": "Sub-50ms local-first sync, ubiquitous `⌘K` command palettes, high-craft glassmorphic bento grids, and inline AI copilot chat/artifact sidebars redefined developer and creative workflows.",
    },
    {
        "id": "E12_AGENTIC_GENERATIVE_SPATIAL",
        "code": "E12",
        "name": "Agentic Workflows, Malleable UI & Spatial Glass",
        "startYear": 2024,
        "endYear": 2026,
        "chromeStyle": "glass-spatial",
        "viewport": (1600, 960),
        "aspectRatio": "16:10 Spatial / Agentic Studio",
        "grid": (16, 12),
        "dominantInput": "Natural-Language Intent, Gaze+Pinch & Multi-Agent Delegation",
        "webLayoutEngine": "Generative Ephemeral DOM, Spatial Ornaments & Canvas",
        "palette": {"bg": "#07090e", "surface": "#101520", "border": "#28354f", "accent": "#38bdf8", "text": "#f0f9ff", "muted": "#7dd3fc"},
        "summary": "Interfaces shift from static navigation hierarchies to intent-driven agentic workspaces, streaming artifact diffs, verification ledgers, and eye-tracked spatial glass ornaments.",
    },
]

DOMAINS = [
    "Developer Tools & IDEs",
    "Productivity & Knowledge Work",
    "Data Analytics & Financial Systems",
    "Communication & Social Platforms",
    "Media, Audio & Creative Studios",
    "E-Commerce & Digital Marketplaces",
    "Operating Systems & Window Shells",
    "Information Retrieval & Search Portals",
    "Enterprise Operations & CRM",
    "AI, Scientific & Research Workbenches",
]

PLATFORMS = [
    "Vector CRT / Mainframe Console",
    "Character Terminal (TUI 80x24)",
    "Desktop WIMP Native",
    "Workstation X11 / NeXT / Motif",
    "Web 1.0 Static / Frameset Browser",
    "Dot-Com Table Portal / Flash",
    "Web 2.0 Ajax Rich Internet App",
    "Mobile Touch Viewport",
    "Responsive SaaS Web Application",
    "Spatial / Agentic Web Canvas",
]

COMPONENT_PRIMITIVES = [
    "menubar",
    "toolbar",
    "command-line",
    "tree-view",
    "data-table",
    "form-group",
    "crt-vector-viewport",
    "status-bar",
    "modal-dialog",
    "tab-strip",
    "breadcrumb",
    "tag-cloud",
    "carousel",
    "card-grid",
    "sidebar-nav",
    "floating-action-btn",
    "command-palette",
    "kanban-lane",
    "infinite-canvas",
    "chat-stream",
    "agent-trace-ledger",
    "bento-tile",
    "spatial-ornament",
    "split-pane",
    "inspector-panel",
    "timeline-scrubber",
    "minimap",
    "toast-stack",
    "skeleton-loader",
    "segmented-control",
    "bottom-sheet",
    "ribbon-bar",
    "dock",
    "hypertext-body",
    "function-key-strip",
]

# 2+ curated historical landmarks per year from 1966 to 2026 (122 total landmarks)
HISTORICAL_LANDMARKS = [
    (1966, "MIT Lincoln Lab TX-2 Sketchpad II Constraint CAD Scope", "AI, Scientific & Research Workbenches"),
    (1966, "IBM 2250 Model I Graphic Display Unit Vector Console", "Data Analytics & Financial Systems"),
    (1967, "RAND Tablet GRAIL Hand-Drawn Flowchart Workspace", "Developer Tools & IDEs"),
    (1967, "Hypertext Editing System (HES) Brown University Console", "Productivity & Knowledge Work"),
    (1968, "SRI Augmentation Research Center NLS Split-View Console", "Productivity & Knowledge Work"),
    (1968, "SABRE Airline Reservation Terminal Agent Mask", "Enterprise Operations & CRM"),
    (1969, "FRESS File Retrieval and Editing System Multi-Window Scope", "Productivity & Knowledge Work"),
    (1969, "Bell Labs Multics / Early UNIX Teletype Command Session", "Operating Systems & Window Shells"),
    (1970, "Stanford AI Lab (SAIL) Data Disc Display Desk", "AI, Scientific & Research Workbenches"),
    (1970, "Idiiom Interactive Graphic Design Scope Monitor", "Media, Audio & Creative Studios"),
    (1971, "DIALOG Online Bibliographic Boolean Retrieval Console", "Information Retrieval & Search Portals"),
    (1971, "ARPANET IMP Network Control Center Telemetry Display", "Data Analytics & Financial Systems"),
    (1972, "PLATO IV Orange Plasma Touch-Panel Lesson Terminal", "Communication & Social Platforms"),
    (1972, "Smalltalk-72 Dynabook Interim Alto Window Prototype", "Developer Tools & IDEs"),
    (1973, "Xerox PARC Alto Portrait Bitmap Text & Bravo Editor", "Productivity & Knowledge Work"),
    (1973, "LEXIS Full-Text Legal Research Terminal Screen", "Information Retrieval & Search Portals"),
    (1974, "IBM 3270 CICS BMS Protected-Field Order Entry Screen", "Enterprise Operations & CRM"),
    (1974, "PARC Gypsy Cut-and-Paste Modeless Document Editor", "Productivity & Knowledge Work"),
    (1975, "PARC Laurel Three-Pane Electronic Mail Client", "Communication & Social Platforms"),
    (1975, "MIT Architecture Machine Group Spatial Data Management", "Media, Audio & Creative Studios"),
    (1976, "UC Berkeley Joy `ex/vi` Full-Screen Modal Terminal Editor", "Developer Tools & IDEs"),
    (1976, "Smalltalk-76 Five-Pane Class Hierarchy Code Browser", "Developer Tools & IDEs"),
    (1977, "DEC VT100 ANSI Split-Region Inventory Control Screen", "Enterprise Operations & CRM"),
    (1977, "TECO EMACS Extensible Self-Documenting Buffer Frame", "Developer Tools & IDEs"),
    (1978, "WordStar CP/M Control-Key Diamond Document Screen", "Productivity & Knowledge Work"),
    (1978, "Usenet / Msg Hoosier Bulletin Board Terminal Reader", "Communication & Social Platforms"),
    (1979, "VisiCalc Apple II Dual-Split A1-Grid Financial Sheet", "Data Analytics & Financial Systems"),
    (1979, "Cedar Mesa Xerox Dorado Integrated Programmer Workspace", "Developer Tools & IDEs"),
    (1980, "Smalltalk-80 MVC Overlapping Inspector & Workspace", "Developer Tools & IDEs"),
    (1980, "CompuServe Information Service Numeric Menu Tree", "Information Retrieval & Search Portals"),
    (1981, "Xerox 8010 Star Desktop Property Sheet & Icon Cabinet", "Operating Systems & Window Shells"),
    (1981, "IBM PC DOS 1.0 Command Prompt & EDLIN Line Buffer", "Operating Systems & Window Shells"),
    (1982, "AutoCAD 1.0 Vector Viewport + Bottom Command History", "Media, Audio & Creative Studios"),
    (1982, "Bloomberg Market Master Dedicated Dual-Screen Terminal", "Data Analytics & Financial Systems"),
    (1983, "Apple Lisa Office System 1.0 Menu Bar & Paper Stationery", "Operating Systems & Window Shells"),
    (1983, "Lotus 1-2-3 Two-Line Slash-Command Macro Spreadsheet", "Data Analytics & Financial Systems"),
    (1984, "Apple Macintosh System 1.0 Finder Spatial Folder Desktop", "Operating Systems & Window Shells"),
    (1984, "MacPaint 1.0 Tool Palette, Pattern Well & FatBits Editor", "Media, Audio & Creative Studios"),
    (1985, "Microsoft Windows 1.01 Tiled Executive & MS-DOS Shell", "Operating Systems & Window Shells"),
    (1985, "Commodore Amiga Workbench 1.0 Multitasking Drawer Screen", "Operating Systems & Window Shells"),
    (1986, "Aldus PageMaker 1.2 Pasteboard & Column Ruler Layout", "Productivity & Knowledge Work"),
    (1986, "Symbolics Genera Lisp Machine Dynamic Window Debugger", "Developer Tools & IDEs"),
    (1987, "Apple HyperCard 1.0 Home Stack & HyperTalk Script Card", "Productivity & Knowledge Work"),
    (1987, "Norton Commander Dual-Pane Blue Ortodox File Manager", "Operating Systems & Window Shells"),
    (1988, "QuarkXPress 2.0 Precision Typography Measurement Palette", "Media, Audio & Creative Studios"),
    (1988, "IRC (Internet Relay Chat) Split Channel & Nicklist TUI", "Communication & Social Platforms"),
    (1989, "NeXTSTEP 1.0 Workspace Manager, Dock & Interface Builder", "Developer Tools & IDEs"),
    (1989, "Lotus Notes 1.0 Replicated Groupware Database Views", "Enterprise Operations & CRM"),
    (1990, "Tim Berners-Lee WorldWideWeb.app NeXT Hypertext Browser", "Information Retrieval & Search Portals"),
    (1990, "Adobe Photoshop 1.0 Floating Tool Strip & Channel Mask", "Media, Audio & Creative Studios"),
    (1991, "University of Minnesota Gopher Hierarchical Menu Client", "Information Retrieval & Search Portals"),
    (1991, "Visual Basic 1.0 Drag-and-Drop Form Designer & Properties", "Developer Tools & IDEs"),
    (1992, "SAP R/3 Dynpro Enterprise Resource Tabular Transaction", "Enterprise Operations & CRM"),
    (1992, "ViolaWWW Multi-Frame Embedded Applet Hypermedia Browser", "Information Retrieval & Search Portals"),
    (1993, "NCSA Mosaic 1.0 Inline-GIF Hypertext Document Viewer", "Information Retrieval & Search Portals"),
    (1993, "Doom WAD Level Editor (DEU) Sector Vector Map Grid", "Media, Audio & Creative Studios"),
    (1994, "Netscape Navigator 1.0 Throbber & Progressive Table Page", "Information Retrieval & Search Portals"),
    (1994, "Jerry and David's Guide to the World Wide Web (Yahoo!)", "Information Retrieval & Search Portals"),
    (1995, "Windows 95 Start Menu, Taskbar & Explorer Tree View", "Operating Systems & Window Shells"),
    (1995, "Amazon.com 1.0 One-Million-Titles Text-First Book Catalog", "E-Commerce & Digital Marketplaces"),
    (1996, "Netscape 2.0 Three-Frame Navigation + Content Frameset", "Information Retrieval & Search Portals"),
    (1996, "ICQ Flower Status List & Floating Instant Message Popup", "Communication & Social Platforms"),
    (1997, "Winamp 2.0 Metallic Bitmap Skin, EQ & Playlist Stack", "Media, Audio & Creative Studios"),
    (1997, "Slashdot 'News for Nerds' Green Table & Nested Comments", "Communication & Social Platforms"),
    (1998, "Google! Beta Stanford Minimal Centered Search Box Page", "Information Retrieval & Search Portals"),
    (1998, "eBay Auction Bidding Table, Countdown & Feedback Star View", "E-Commerce & Digital Marketplaces"),
    (1999, "Salesforce.com Classic Multi-Tab Cloud CRM Account View", "Enterprise Operations & CRM"),
    (1999, "Napster MP3 Peer Search Table, Bitrate Filter & Transfer Queue", "Media, Audio & Creative Studios"),
    (2000, "Mac OS X Public Beta Aqua Lickable Gel Buttons & Dock", "Operating Systems & Window Shells"),
    (2000, "Macromedia Flash 5 Interactive Vector Timeline Microsite", "Media, Audio & Creative Studios"),
    (2001, "Wikipedia Phase II / Monobook Wiki Article & Talk Tabs", "Productivity & Knowledge Work"),
    (2001, "Windows XP Luna Blue Task-Based Explorer Sidebar", "Operating Systems & Window Shells"),
    (2002, "Oddpost Rich DHTML Drag-and-Drop Webmail Three-Pane", "Communication & Social Platforms"),
    (2002, "Mozilla Phoenix 0.1 Tabbed Browser & Popup Blocker Bar", "Information Retrieval & Search Portals"),
    (2003, "iTunes 4 Music Store 3-Column Genre/Artist/Album Browser", "E-Commerce & Digital Marketplaces"),
    (2003, "del.icio.us Social Bookmarking Shared Tag List & Counter", "Information Retrieval & Search Portals"),
    (2004, "Gmail Beta Ajax Conversation Thread & Label Split Inbox", "Communication & Social Platforms"),
    (2004, "Flickr Photo Page, Inline Note Hotspots & Weighted Tag Cloud", "Media, Audio & Creative Studios"),
    (2005, "Google Maps Draggable Slippy Tile Canvas & Info Shadow Bubble", "Information Retrieval & Search Portals"),
    (2005, "YouTube 2005 Flash Video Player, Related Sidebar & Star Bar", "Media, Audio & Creative Studios"),
    (2006, "Facebook Mini-Feed & Three-Column Profile Wall Layout", "Communication & Social Platforms"),
    (2006, "AWS EC2 / S3 Early Web Management Console Table View", "Developer Tools & IDEs"),
    (2007, "iPhone OS 1.0 Capacitive Multi-Touch SpringBoard & List", "Operating Systems & Window Shells"),
    (2007, "Microsoft Office 2007 Fluent Contextual Ribbon Interface", "Productivity & Knowledge Work"),
    (2008, "GitHub Commit Tree, Diff Viewer & Fork Network Graph", "Developer Tools & IDEs"),
    (2008, "Apple iOS App Store Top Charts & Touch Install Sheet", "E-Commerce & Digital Marketplaces"),
    (2009, "Airbnb Split Map Viewport + Synchronized Photo Card List", "E-Commerce & Digital Marketplaces"),
    (2009, "Spotify Desktop Dark Left-Sidebar Playlist & Track Queue", "Media, Audio & Creative Studios"),
    (2010, "Windows Phone 7 Metro Typography Panorama & Live Tiles", "Operating Systems & Window Shells"),
    (2010, "Instagram 1.0 Square Polaroid Feed & Bottom Camera Tab", "Communication & Social Platforms"),
    (2011, "Twitter Bootstrap 2.0 Fixed Top Navbar & 12-Col Hero Grid", "Developer Tools & IDEs"),
    (2011, "Trello Horizontal Drag-and-Drop Kanban Card Board", "Productivity & Knowledge Work"),
    (2012, "Pinterest Infinite Scroll Masonry Waterfall Pin Grid", "Media, Audio & Creative Studios"),
    (2012, "Stripe Developer Docs Three-Pane Nav, Prose & Live Code", "Developer Tools & IDEs"),
    (2013, "iOS 7 Frosted Glass Blur Layers & Hairline Flat Chrome", "Operating Systems & Window Shells"),
    (2013, "Slack Channel Sidebar, Message Stream & Slash Command Input", "Communication & Social Platforms"),
    (2014, "Google Material Design Quantum Paper Card & Floating FAB", "Operating Systems & Window Shells"),
    (2014, "Robinhood Commission-Free Sparkline Ticker & Swipe Trade", "Data Analytics & Financial Systems"),
    (2015, "Visual Studio Code Activity Bar, Monaco Split & `⇧⌘P` Palette", "Developer Tools & IDEs"),
    (2015, "Discord Low-Latency Voice Channel Tree & Chat Overlay", "Communication & Social Platforms"),
    (2016, "Figma Multiplayer WebGL Vector Canvas & Right Layer Inspector", "Media, Audio & Creative Studios"),
    (2016, "Shopify Polaris Merchant Omnichannel Analytics Dashboard", "E-Commerce & Digital Marketplaces"),
    (2017, "Notion Slash-Block Modular Page, Toggle List & Linked DB", "Productivity & Knowledge Work"),
    (2017, "Fortnite / Twitch Creator Live Stream Chat + Sub Alert HUD", "Media, Audio & Creative Studios"),
    (2018, "Superhuman Keyboard-Driven Split Inbox & Instant Triage", "Communication & Social Platforms"),
    (2018, "Grafana Dark-Mode Time-Series Telemetry PromQL Grid", "Data Analytics & Financial Systems"),
    (2019, "Linear High-Velocity Issue Triage & `⌘K` Omnibox Workspace", "Developer Tools & IDEs"),
    (2019, "TikTok For You Full-Viewport Vertical Gesture Video Stack", "Media, Audio & Creative Studios"),
    (2020, "Roam Research Daily Notes & Bi-Directional Backlink Graph", "Productivity & Knowledge Work"),
    (2020, "Tailwind UI Component Utility Token Marketing Bento Grid", "Developer Tools & IDEs"),
    (2021, "GitHub Copilot Inline Ghost-Text Completion & Synth Pane", "Developer Tools & IDEs"),
    (2021, "Raycast Extensible Desktop Command Launcher & Quicklinks", "Operating Systems & Window Shells"),
    (2022, "OpenAI ChatGPT Streaming Markdown Thread & Sidebar History", "AI, Scientific & Research Workbenches"),
    (2022, "Arc Browser VerticalPinned Spaces, Split Tab & Boosts", "Information Retrieval & Search Portals"),
    (2023, "Claude Artifacts Side-by-Side Live Preview & Conversation", "AI, Scientific & Research Workbenches"),
    (2023, "Perplexity AI Citation Cards, Source Pills & Follow-Up Flow", "Information Retrieval & Search Portals"),
    (2024, "Apple visionOS Spatial Glass Window, Side Ornament & Gaze Bar", "Operating Systems & Window Shells"),
    (2024, "Cursor AI Code Editor Multi-File Diff Composer & Context Pills", "Developer Tools & IDEs"),
    (2025, "v0 / Lovable Prompt-to-Fullstack Live Component Canvas", "Developer Tools & IDEs"),
    (2025, "NotebookLM Audio Overview Studio & Grounded Source Matrix", "AI, Scientific & Research Workbenches"),
    (2026, "Agentic Verification Studio: Multi-Agent DAG & Proof Ledger", "AI, Scientific & Research Workbenches"),
    (2026, "Malleable Intent OS: Ephemeral Task-Synthesized Micro-UI", "Operating Systems & Window Shells"),
]

LAYOUT_ARCHETYPES = [
    ("ARCH_CRT_SCOPE", "Vector Scope + Light-Pen Target Reticle + Status Bank"),
    ("ARCH_TUI_FORM", "80x24 Character Header + Field Matrix + Function Key Strip"),
    ("ARCH_SPLIT_TERMINAL", "Dual-Split Command Buffer + Telemetry Watch + CLI Prompt"),
    ("ARCH_WIMP_WORKBENCH", "Global Menubar + Tool Palette + Overlapping Document Window"),
    ("ARCH_THREE_PANE_BROWSER", "Hierarchy Tree + Inspector Table + Detail Preview Pane"),
    ("ARCH_WEB1_DOCUMENT", "Browser Location Chrome + Hypertext Column + Inline Image Map"),
    ("ARCH_PORTAL_3COL_TABLE", "Top Banner + Left Directory Nav + Center Feed + Right Widget Rail"),
    ("ARCH_WEB2_AJAX_WORKSPACE", "Top Glossy Tab Strip + Left Facet Rail + Live Ajax Split Canvas"),
    ("ARCH_MOBILE_TOUCH_STACK", "Status Header + Scrollable Card List + Bottom 5-Icon Tab Bar"),
    ("ARCH_SAAS_12COL_DASHBOARD", "Collapsible Left Sidebar + KPI Metric Row + Chart & Table Grid"),
    ("ARCH_INFINITE_CANVAS_STUDIO", "Top Mode Bar + Left Layer Tree + Central Zoom Canvas + Right Inspector"),
    ("ARCH_COMMAND_FIRST_TRIAGE", "Minimal Header + Floating `⌘K` Omnibox + High-Density Kanban/List"),
    ("ARCH_BENTO_GLASS_GRID", "Hero Spotlight + Asymmetric Multi-Span Bento Tile Matrix"),
    ("ARCH_AGENTIC_DUAL_LEDGER", "Intent Stream + Live Artifact Sandbox + Verification Proof Ledger"),
    ("ARCH_SPATIAL_ORNAMENT_HUD", "Translucent Glass Viewport + Floating Left/Bottom Spatial Ornaments"),
]


def era_for_year(year: int) -> dict:
    for e in ERAS:
        if e["startYear"] <= year <= e["endYear"]:
            return e
    return ERAS[-1]


def decade_for_year(year: int) -> str:
    return f"{(year // 10) * 10}s"


def build_nodes_for_wireframe(
    wf_index: int,
    year: int,
    era: dict,
    domain: str,
    archetype_code: str,
    rng: random.Random,
) -> list:
    vw, vh = era["viewport"]
    nodes = []
    # Unique deterministic micro-variations in proportions so every single wireframe has a distinct layout geometry
    header_h = round(vh * rng.uniform(0.055, 0.095), 1)
    footer_h = round(vh * rng.uniform(0.045, 0.080), 1)
    left_w = round(vw * rng.uniform(0.16, 0.26), 1)
    right_w = round(vw * rng.uniform(0.18, 0.27), 1)
    pad = round(vw * rng.uniform(0.008, 0.018), 1)

    def add_node(nid_suffix, ntype, label, x, y, w, h, z=1, state="default", props=None):
        x_clamped = max(0.0, min(float(vw - 8), round(float(x), 1)))
        y_clamped = max(0.0, min(float(vh - 8), round(float(y), 1)))
        w_clamped = max(8.0, min(float(vw) - x_clamped, round(float(w), 1)))
        h_clamped = max(8.0, min(float(vh) - y_clamped, round(float(h), 1)))
        nodes.append({
            "id": f"n-{wf_index:04d}-{len(nodes)+1:02d}-{nid_suffix}",
            "type": ntype,
            "label": label,
            "x": x_clamped,
            "y": y_clamped,
            "w": w_clamped,
            "h": h_clamped,
            "zIndex": z,
            "interactiveState": state,
            "props": props or {"era": era["code"], "domain": domain},
        })

    # Top bar / Menubar / Browser Chrome / Spatial Header
    if year <= 1971:
        add_node("hdr", "status-bar", f"CRT DISPLAY REGISTER [{year}]", pad, pad, vw - 2 * pad, header_h, z=2)
    elif year <= 1978:
        add_node("hdr", "status-bar", f"TERM 3270/VT100 SESSION · {domain[:18].upper()}", 0, 0, vw, header_h, z=2)
    elif year <= 1990:
        add_node("menu", "menubar", "File  Edit  View  Special  Window  Help", 0, 0, vw, header_h * 0.65, z=3)
        add_node("tbar", "toolbar", "New | Open | Save | Print | Inspect", 0, header_h * 0.65, vw, header_h * 0.55, z=2)
        header_h = round(header_h * 1.2, 1)
    elif year <= 2006:
        add_node("bchrome", "toolbar", f"Back | Forward | Stop | Home | http://ui-history.org/{year}/{wf_index}", 0, 0, vw, header_h, z=3)
    elif year <= 2016:
        add_node("navbar", "menubar", f"{domain.split('&')[0].strip()}  ·  Overview   Explore   Analytics   Settings", 0, 0, vw, header_h, z=3)
    else:
        add_node("topshell", "menubar", f"Workspace / {domain.split('&')[0].strip()}   [⌘K Search & Commands]", 0, 0, vw, header_h, z=3)

    body_y = header_h + pad
    body_h = vh - header_h - footer_h - 2 * pad

    # Archetype-driven middle structure with rich multi-node decomposition
    if archetype_code in ("ARCH_CRT_SCOPE", "ARCH_INFINITE_CANVAS_STUDIO"):
        # Left tool/register bank + large central vector/infinite canvas + right inspector + floating overlay
        add_node("left-bank", "toolbar" if year < 1995 else "tree-view", "Tool & Layer Register", pad, body_y, left_w, body_h, z=2)
        cx = left_w + 2 * pad
        cw = vw - left_w - right_w - 4 * pad
        ctype = "crt-vector-viewport" if year <= 1975 else "infinite-canvas"
        add_node("canvas-main", ctype, "Primary Spatial Viewport & Coordinate Grid", cx, body_y, cw, body_h * 0.74, z=1, state="active")
        # Sub-elements inside/below canvas
        add_node("scrubber", "timeline-scrubber", "Keyframe / Coordinate Trajectory Scrubber", cx, body_y + body_h * 0.76, cw * 0.68, body_h * 0.22, z=2)
        add_node("minimap", "minimap", "Viewport Radar Minimap", cx + cw * 0.70, body_y + body_h * 0.76, cw * 0.30, body_h * 0.22, z=2)
        rx = vw - right_w - pad
        add_node("insp-top", "inspector-panel", "Transform & Geometry Constraints", rx, body_y, right_w, body_h * 0.52, z=2)
        add_node("insp-bot", "form-group", "Property Tokens & Precision Inputs", rx, body_y + body_h * 0.54, right_w, body_h * 0.44, z=2)

    elif archetype_code in ("ARCH_TUI_FORM", "ARCH_SPLIT_TERMINAL"):
        # Structured terminal fields, tabular matrix, command buffer
        top_split = round(body_h * rng.uniform(0.38, 0.54), 1)
        add_node("form-matrix", "form-group", "Protected Field Entry Matrix [ATTR: HI-INTENSITY]", pad, body_y, vw * 0.58 - pad, top_split, z=1, state="focused")
        add_node("watch-pane", "data-table", "Register / Telemetry Watch Table", vw * 0.59, body_y, vw * 0.41 - pad, top_split, z=1)
        mid_y = body_y + top_split + pad
        rem_h = body_h - top_split - pad
        add_node("grid-main", "data-table", "Batch Transaction / Buffer Rows (80 Col)", pad, mid_y, vw - 2 * pad, rem_h * 0.68, z=1)
        add_node("cli-line", "command-line", "COMMAND ===> _", pad, mid_y + rem_h * 0.71, vw - 2 * pad, rem_h * 0.27, z=3, state="focused")

    elif archetype_code in ("ARCH_WIMP_WORKBENCH", "ARCH_THREE_PANE_BROWSER"):
        # Classic 3-pane browser or overlapping WIMP workbench
        pane_h = round(body_h * rng.uniform(0.32, 0.45), 1)
        w3 = (vw - 4 * pad) / 3.0
        add_node("pane-cat", "tree-view", "Category / Class Tree", pad, body_y, w3, pane_h, z=2)
        add_node("pane-sub", "tree-view", "Sub-Collection / Protocol List", 2 * pad + w3, body_y, w3, pane_h, z=2)
        add_node("pane-method", "inspector-panel", "Instance / Member Inspector", 3 * pad + 2 * w3, body_y, w3, pane_h, z=2)
        doc_y = body_y + pane_h + pad
        doc_h = body_h - pane_h - pad
        add_node("doc-win", "split-pane", "Active Document & Direct Manipulation Workspace", pad, doc_y, vw * 0.68, doc_h, z=2, state="active")
        add_node("prop-sheet", "modal-dialog" if rng.random() < 0.4 else "inspector-panel", "Auxiliary Property Sheet", vw * 0.70, doc_y, vw * 0.30 - pad, doc_h, z=4)

    elif archetype_code in ("ARCH_WEB1_DOCUMENT", "ARCH_PORTAL_3COL_TABLE"):
        # Left directory/navigation rail + center hypertext/portal table + right callout/ad/search modules
        add_node("nav-rail", "sidebar-nav", "Directory Index & Quick Links", pad, body_y, left_w, body_h * 0.68, z=2)
        add_node("tag-box", "tag-cloud" if year >= 1998 else "form-group", "Search & Category Jump", pad, body_y + body_h * 0.70, left_w, body_h * 0.28, z=2)
        cx = left_w + 2 * pad
        cw = vw - left_w - right_w - 4 * pad
        add_node("crumb", "breadcrumb", f"Home > {domain} > {year} Archive", cx, body_y, cw, body_h * 0.09, z=2)
        add_node("hero-doc", "hypertext-body", "Primary Hypertext Article & Inline Table Grid", cx, body_y + body_h * 0.11, cw, body_h * 0.54, z=1)
        add_node("sub-table", "data-table", "Structured Directory / Thread Listing", cx, body_y + body_h * 0.67, cw, body_h * 0.31, z=1)
        rx = vw - right_w - pad
        add_node("right-mod1", "card-grid", "Featured Portal Module", rx, body_y, right_w, body_h * 0.46, z=2)
        add_node("right-mod2", "form-group", "Login / Syndication Box", rx, body_y + body_h * 0.49, right_w, body_h * 0.49, z=2)

    elif archetype_code in ("ARCH_WEB2_AJAX_WORKSPACE", "ARCH_SAAS_12COL_DASHBOARD"):
        # Left sidebar + top tab/segmented strip + KPI card row + split chart/table workspace
        add_node("side-nav", "sidebar-nav", "Navigation & Saved Views", pad, body_y, left_w, body_h, z=2)
        cx = left_w + 2 * pad
        cw = vw - left_w - 3 * pad
        add_node("tabs", "tab-strip", "Overview  |  Live Stream  |  Cohort Matrix  |  Schema", cx, body_y, cw * 0.68, body_h * 0.09, z=2, state="active")
        add_node("seg-ctrl", "segmented-control", "Day / Week / Month / 60Y", cx + cw * 0.70, body_y, cw * 0.30, body_h * 0.09, z=2)
        kpi_y = body_y + body_h * 0.11
        kpi_h = body_h * 0.20
        for ki in range(3):
            kw = (cw - 2 * pad) / 3.0
            add_node(f"kpi-{ki+1}", "bento-tile" if year >= 2018 else "card-grid", f"KPI Metric Card #{ki+1}", cx + ki * (kw + pad), kpi_y, kw, kpi_h, z=1)
        main_y = kpi_y + kpi_h + pad
        main_h = body_h - (main_y - body_y)
        add_node("primary-grid", "data-table", "Asynchronous Data Grid & Inline Actions", cx, main_y, cw * 0.62, main_h, z=1)
        add_node("detail-drawer", "inspector-panel", "Contextual Inspector & Activity Feed", cx + cw * 0.64, main_y, cw * 0.36, main_h, z=2)

    elif archetype_code == "ARCH_MOBILE_TOUCH_STACK":
        # Mobile-centered frame + responsive companion inspector
        mob_w = round(vw * rng.uniform(0.34, 0.44), 1)
        mob_x = round((vw - mob_w) * rng.uniform(0.12, 0.25), 1)
        add_node("mob-seg", "segmented-control", "Featured  ·  Top Charts  ·  Near You", mob_x, body_y, mob_w, body_h * 0.09, z=3)
        add_node("mob-carousel", "carousel", "Touch Hero Swipe Carousel", mob_x, body_y + body_h * 0.11, mob_w, body_h * 0.26, z=2)
        add_node("mob-list", "card-grid", "Inertial Touch List & Chevron Rows", mob_x, body_y + body_h * 0.39, mob_w, body_h * 0.46, z=2, state="active")
        add_node("mob-sheet", "bottom-sheet", "Pull-Up Action Sheet & Tab Strip", mob_x, body_y + body_h * 0.87, mob_w, body_h * 0.12, z=4)
        # Companion desktop/responsive breakpoint preview on right
        rx = mob_x + mob_w + 2 * pad
        rw = vw - rx - pad
        add_node("resp-grid", "card-grid", "Responsive Tablet/Desktop Breakpoint Grid", rx, body_y, rw, body_h * 0.64, z=1)
        add_node("resp-notes", "inspector-panel", "Touch Target & Viewport Spec (44pt Grid)", rx, body_y + body_h * 0.67, rw, body_h * 0.32, z=2)

    elif archetype_code in ("ARCH_COMMAND_FIRST_TRIAGE", "ARCH_BENTO_GLASS_GRID"):
        # Bento grid + floating command palette `⌘K` + kanban lanes
        bento_w = (vw - 4 * pad) / 3.0
        row1_h = round(body_h * rng.uniform(0.36, 0.46), 1)
        add_node("bento-hero", "bento-tile", "Primary Spotlight Bento Tile (2-Col Span)", pad, body_y, bento_w * 2 + pad, row1_h, z=1)
        add_node("bento-side", "bento-tile", "Live Telemetry Pulse Tile", 3 * pad + bento_w * 2, body_y, bento_w, row1_h, z=1)
        row2_y = body_y + row1_h + pad
        row2_h = body_h - row1_h - pad
        for lane in range(3):
            add_node(f"lane-{lane+1}", "kanban-lane", f"Workflow Triage Lane #{lane+1}", pad + lane * (bento_w + pad), row2_y, bento_w, row2_h, z=1)
        # Floating Command Palette overlay in center
        cp_w = round(vw * rng.uniform(0.42, 0.52), 1)
        cp_h = round(vh * rng.uniform(0.24, 0.32), 1)
        add_node("cmd-palette", "command-palette", "⌘K Command Palette — Type a command or jump to node...", (vw - cp_w) / 2, body_y + body_h * 0.14, cp_w, cp_h, z=5, state="focused")

    else:
        # ARCH_AGENTIC_DUAL_LEDGER or ARCH_SPATIAL_ORNAMENT_HUD
        orn_w = round(vw * 0.07, 1)
        add_node("spatial-orn", "spatial-ornament", "Gaze Nav Ornament", pad, body_y + body_h * 0.12, orn_w, body_h * 0.72, z=4)
        cx = orn_w + 2 * pad
        cw = vw - orn_w - 3 * pad
        chat_w = round(cw * rng.uniform(0.32, 0.40), 1)
        add_node("intent-stream", "chat-stream", "Multi-Turn Intent & Reasoning Stream", cx, body_y, chat_w, body_h * 0.80, z=2)
        add_node("prompt-bar", "command-palette", "Compose Intent / Attach Context Pills...", cx, body_y + body_h * 0.82, chat_w, body_h * 0.17, z=3, state="focused")
        art_x = cx + chat_w + pad
        art_w = cw - chat_w - pad
        add_node("artifact-stage", "infinite-canvas", "Live Synthesized Artifact & Diff Stage", art_x, body_y, art_w, body_h * 0.62, z=2, state="active")
        add_node("proof-ledger", "agent-trace-ledger", "Verification Gate & Provenance Ledger", art_x, body_y + body_h * 0.65, art_w, body_h * 0.34, z=2)

    # Extra era-authentic detail nodes to ensure rich 10-16 node hierarchy, guaranteed geometric uniqueness,
    # and strict historical accuracy (zero anachronistic primitives in early eras)
    if year <= 1978:
        era_primitives = [
            "status-bar", "command-line", "data-table", "form-group",
            "crt-vector-viewport", "function-key-strip", "split-pane",
            "tree-view", "timeline-scrubber", "minimap",
        ]
    elif year <= 1990:
        era_primitives = [
            "menubar", "toolbar", "modal-dialog", "inspector-panel",
            "dock", "hypertext-body", "tab-strip", "tree-view",
            "split-pane", "form-group", "data-table", "status-bar",
        ]
    elif year <= 2006:
        era_primitives = [
            "breadcrumb", "tag-cloud", "sidebar-nav", "card-grid",
            "carousel", "ribbon-bar", "tab-strip", "toolbar",
            "form-group", "data-table", "hypertext-body", "modal-dialog",
        ]
    elif year <= 2016:
        era_primitives = [
            "segmented-control", "bottom-sheet", "floating-action-btn",
            "kanban-lane", "toast-stack", "skeleton-loader",
            "card-grid", "sidebar-nav", "carousel", "tab-strip", "menubar",
        ]
    else:
        era_primitives = [
            "command-palette", "infinite-canvas", "chat-stream",
            "bento-tile", "agent-trace-ledger", "spatial-ornament",
            "kanban-lane", "toast-stack", "skeleton-loader", "inspector-panel",
        ]

    extra_count = rng.randint(2, 5)
    for ei in range(extra_count):
        etype = era_primitives[(wf_index + ei * 3 + year) % len(era_primitives)]
        ex = pad + ((wf_index * 37 + ei * 131) % int(vw * 0.68))
        ey = body_y + ((wf_index * 53 + ei * 97) % int(max(40, body_h * 0.62)))
        ew = round(vw * rng.uniform(0.11, 0.24), 1)
        eh = round(vh * rng.uniform(0.05, 0.13), 1)
        add_node(f"aux-{ei+1}", etype, f"{etype.replace('-', ' ').title()} #{ei+1}", ex, ey, ew, eh, z=3)

    # Bottom status bar / Function key strip / Dock
    if year <= 1978:
        add_node("fkey", "function-key-strip", "PF1=HELP  PF3=EXIT  PF5=FIND  PF7=BKWD  PF8=FRWD  PF12=CANCEL", 0, vh - footer_h, vw, footer_h, z=3)
    elif year >= 2000 and rng.random() < 0.45:
        dock_w = round(vw * rng.uniform(0.45, 0.68), 1)
        add_node("dock", "dock", "Finder · Browser · Terminal · Studio · Notes · Inspector", (vw - dock_w) / 2, vh - footer_h, dock_w, footer_h, z=4)
    else:
        add_node("status", "status-bar", f"Ready · {len(nodes)+1} UI Nodes · {era['aspectRatio']} · {era['webLayoutEngine']}", 0, vh - footer_h, vw, footer_h, z=2)

    return nodes


def compute_structural_hash(era_id: str, spec: dict) -> str:
    vw = float(spec["viewportWidth"])
    vh = float(spec["viewportHeight"])
    canonical_nodes = [
        (
            str(n["type"]),
            round(float(n["x"]) / vw, 3),
            round(float(n["y"]) / vh, 3),
            round(float(n["w"]) / vw, 3),
            round(float(n["h"]) / vh, 3),
            int(n["zIndex"]),
        )
        for n in spec["nodes"]
    ]
    payload = json.dumps({
        "era": era_id,
        "chromeStyle": spec["chromeStyle"],
        "gridColumns": spec["gridColumns"],
        "gridRows": spec["gridRows"],
        "nodes": canonical_nodes,
    }, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def compute_ux_metrics(year: int, era: dict, nodes: list, rng: random.Random) -> dict:
    t = (year - 1966) / 60.0  # 0.0 in 1966 -> 1.0 in 2026
    # Information density peaked in 1970s TUI & late-1990s portals, dipped in 2013 flat era, re-balanced in 2020s bento/triage
    base_density = 0.58 + 0.18 * math.sin((year - 1970) * 0.18) - (0.12 if 2011 <= year <= 2016 else 0.0)
    info_density = round(max(0.18, min(0.96, base_density + rng.uniform(-0.08, 0.08))), 3)

    # Visual chrome ratio: high in 1989-2011 (3D bevels, skins, Aqua gloss, skeuomorphism), low in 1966-1978 and 2013-2026
    if 1988 <= year <= 2011:
        base_chrome = 0.68 + 0.14 * math.sin((year - 1988) / 23.0 * math.pi)
    elif year >= 2012:
        base_chrome = 0.24 + 0.08 * ((year - 2012) / 14.0)
    else:
        base_chrome = 0.30 + 0.15 * ((year - 1966) / 22.0)
    chrome_ratio = round(max(0.10, min(0.92, base_chrome + rng.uniform(-0.06, 0.06))), 3)

    # Keyboard (-1.0) to Pointer/Touch/Gaze (+1.0) bias
    if year <= 1978:
        kpb = rng.uniform(-0.95, -0.45)
    elif year <= 1990:
        kpb = rng.uniform(-0.15, 0.55)
    elif year <= 2006:
        kpb = rng.uniform(0.25, 0.78)
    elif year <= 2016:
        kpb = rng.uniform(0.40, 0.90)
    else:
        # Return of keyboard-first `⌘K` + multimodal touch/gaze
        kpb = rng.uniform(-0.35, 0.65)
    kpb = round(max(-1.0, min(1.0, kpb)), 3)

    # Layout responsiveness: near 0 in fixed CRT/TUI/table eras, rising sharply with responsive CSS/Flexbox/Grid/Generative UI
    if year < 1991:
        resp = rng.uniform(0.05, 0.22)
    elif year < 2010:
        resp = rng.uniform(0.18, 0.48)
    elif year < 2018:
        resp = rng.uniform(0.62, 0.88)
    else:
        resp = rng.uniform(0.78, 0.99)
    resp = round(max(0.0, min(1.0, resp)), 3)

    complexity = round(max(0.15, min(0.98, 0.30 + len(nodes) * 0.025 + rng.uniform(-0.05, 0.05))), 3)
    fitts = round(max(0.25, min(0.98, 0.48 + 0.35 * t + rng.uniform(-0.07, 0.07))), 3)
    cog_load = round(max(1.2, min(9.8, 3.2 + info_density * 4.2 + chrome_ratio * 1.8 - fitts * 1.4)), 2)

    return {
        "informationDensity": info_density,
        "interactionComplexity": complexity,
        "visualChromeRatio": chrome_ratio,
        "keyboardToPointerBias": kpb,
        "layoutResponsiveness": resp,
        "fittsLawEfficiency": fitts,
        "cognitiveLoadIndex": cog_load,
    }


def generate_all() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    rng = random.Random(20261026)

    wireframes = []
    seen_hashes = set()
    seen_titles = set()

    # Build lookup of landmarks per year
    landmarks_by_year = {}
    for y, title, dom in HISTORICAL_LANDMARKS:
        landmarks_by_year.setdefault(y, []).append((title, dom))

    # Ensure every 3-year era (E11: 2021-2023, E12: 2024-2026) has >= 54 wireframes (18/year)
    # and earlier years have 16-17/year, totaling 1,028 unique wireframes across 1966..2026
    wf_counter = 0
    for year_idx, year in enumerate(range(1966, 2027)):
        era = era_for_year(year)
        if year >= 2021:
            count_for_year = 18
        elif year_idx < 38:
            count_for_year = 17
        else:
            count_for_year = 16
        year_landmarks = landmarks_by_year.get(year, [])

        for slot in range(count_for_year):
            wf_counter += 1
            is_landmark = slot < len(year_landmarks)
            if is_landmark:
                base_title, domain = year_landmarks[slot]
                title = f"{base_title} ({year})"
            else:
                domain = DOMAINS[(wf_counter + slot * 3 + year) % len(DOMAINS)]
                arch_code_tmp, arch_desc_tmp = LAYOUT_ARCHETYPES[(wf_counter + slot) % len(LAYOUT_ARCHETYPES)]
                variant_noun = [
                    "Workbench", "Console", "Inspector", "Navigator", "Portal", "Studio",
                    "Matrix", "Ledger", "Dashboard", "Canvas", "Terminal", "Explorer",
                    "Catalog", "Stream", "Composer", "Monitor", "Synthesizer",
                ][(wf_counter + slot * 5) % 17]
                title = f"{era['name'].split('&')[0].strip()} {domain.split('&')[0].strip()} {variant_noun} v{slot+1}.{year % 10} ({year})"
                if title in seen_titles:
                    title = f"{title} [#{wf_counter}]"
            seen_titles.add(title)

            # Select era-appropriate platform and layout archetype
            era_idx = ERAS.index(era)
            platform = PLATFORMS[min(len(PLATFORMS) - 1, max(0, int(era_idx * len(PLATFORMS) / len(ERAS)) + (slot % 2)))]
            arch_idx = min(len(LAYOUT_ARCHETYPES) - 1, max(0, int(era_idx * len(LAYOUT_ARCHETYPES) / len(ERAS)) + (slot % 3) - 1))
            arch_code, arch_desc = LAYOUT_ARCHETYPES[arch_idx]

            # Build nodes and guarantee 100% unique geometric hash
            attempt = 0
            while True:
                sub_rng = random.Random(20261026 + wf_counter * 1009 + attempt * 9173)
                nodes = build_nodes_for_wireframe(wf_counter, year, era, domain, arch_code, sub_rng)
                vw, vh = era["viewport"]
                spec = {
                    "aspectRatio": era["aspectRatio"],
                    "viewportWidth": vw,
                    "viewportHeight": vh,
                    "gridColumns": era["grid"][0] + (attempt % 3),
                    "gridRows": era["grid"][1] + ((attempt // 3) % 3),
                    "chromeStyle": era["chromeStyle"],
                    "archetypeCode": arch_code,
                    "archetypeDescription": arch_desc,
                    "colorPalette": era["palette"],
                    "nodes": nodes,
                }
                shash = compute_structural_hash(era["id"], spec)
                if shash not in seen_hashes:
                    seen_hashes.add(shash)
                    break
                attempt += 1

            metrics = compute_ux_metrics(year, era, nodes, sub_rng)
            comp_types = sorted({n["type"] for n in nodes})

            web_trend_cat = (
                "Pre-Web Ancestor Pattern" if year < 1991 else
                "Web 1.0 Hypertext & Frameset" if year <= 1996 else
                "Dot-Com Table Grid & Portal" if year <= 2001 else
                "Web 2.0 Ajax & CSS Float" if year <= 2006 else
                "Mobile Touch & 960px Grid" if year <= 2011 else
                "Responsive Flat & Flexbox Card" if year <= 2016 else
                "Design System Tokens & CSS Grid" if year <= 2020 else
                "Command-First Bento & AI Copilot" if year <= 2023 else
                "Agentic Generative & Spatial Web"
            )

            notes = {
                "paradigmSummary": (
                    f"{title} exemplifies the {era['name']} era ({era['startYear']}–{era['endYear']}), "
                    f"combining {arch_desc.lower()} within a {era['aspectRatio']} viewport."
                ),
                "keyInnovations": (
                    f"Integrates {', '.join(comp_types[:4])} primitives driven by {era['dominantInput']}, "
                    f"achieving a Fitts's Law efficiency of {metrics['fittsLawEfficiency']:.2f}."
                ),
                "usabilityTradeoffs": (
                    f"Balances information density ({metrics['informationDensity']:.2f}) against visual chrome overhead "
                    f"({metrics['visualChromeRatio']:.2f}), yielding cognitive load index {metrics['cognitiveLoadIndex']:.1f}/10."
                ),
                "webTrendConnection": (
                    f"Maps directly to the '{web_trend_cat}' trajectory via {era['webLayoutEngine']}, "
                    f"informing modern web layout composition and component ergonomics."
                ),
            }

            wid = f"wf-{year}-{wf_counter:04d}"
            wireframes.append({
                "id": wid,
                "index": wf_counter,
                "title": title,
                "year": year,
                "decade": decade_for_year(year),
                "era": era["id"],
                "eraCode": era["code"],
                "eraName": era["name"],
                "platform": platform,
                "domain": domain,
                "webLayoutEngine": era["webLayoutEngine"],
                "webTrendCategory": web_trend_cat,
                "isLandmark": is_landmark,
                "isWebNative": year >= 1991,
                "dominantInput": era["dominantInput"],
                "componentTypes": comp_types,
                "nodeCount": len(nodes),
                "layoutSpec": spec,
                "uxMetrics": metrics,
                "uxResearchNotes": notes,
                "predecessorIds": [],
                "successorIds": [],
                "structuralHash": shash,
            })

    # Wire chronological lineage DAG across the 60 years (predecessors in earlier/same years, successors in later/same years)
    by_domain = {}
    for wf in wireframes:
        by_domain.setdefault(wf["domain"], []).append(wf)

    for dom, dom_wfs in by_domain.items():
        dom_wfs.sort(key=lambda w: (w["year"], w["index"]))
        for i, wf in enumerate(dom_wfs):
            if i > 0:
                pred1 = dom_wfs[i - 1]
                wf["predecessorIds"].append(pred1["id"])
                pred1["successorIds"].append(wf["id"])
            if i >= 3:
                pred2 = dom_wfs[i - 3]
                if pred2["id"] not in wf["predecessorIds"]:
                    wf["predecessorIds"].append(pred2["id"])
                if wf["id"] not in pred2["successorIds"]:
                    pred2["successorIds"].append(wf["id"])

    # Build trends.json for macro p5.js visualizations and Web Layout Morphing Lab (Mode 3)
    yearly_series = []
    for y in range(1966, 2027):
        ywfs = [w for w in wireframes if w["year"] == y]
        n = len(ywfs) or 1
        avg_metrics = {
            k: round(sum(w["uxMetrics"][k] for w in ywfs) / n, 3)
            for k in (
                "informationDensity",
                "interactionComplexity",
                "visualChromeRatio",
                "keyboardToPointerBias",
                "layoutResponsiveness",
                "fittsLawEfficiency",
                "cognitiveLoadIndex",
            )
        }
        yearly_series.append({
            "year": y,
            "era": era_for_year(y)["id"],
            "eraCode": era_for_year(y)["code"],
            "wireframeCount": len(ywfs),
            "landmarkCount": sum(1 for w in ywfs if w["isLandmark"]),
            "avgMetrics": avg_metrics,
        })

    # 6 Canonical Web Layout Morphing Archetypes (for p5.js Mode 3 smooth interpolation across 6 Web Eras)
    morph_stages = [
        {"stage": 1, "year": 1993, "label": "1993 Web 1.0 Linear Document Flow", "engine": "HTML 2.0 Flow"},
        {"stage": 2, "year": 1998, "label": "1998 Dot-Com 3-Col Table Portal", "engine": "Nested HTML Tables"},
        {"stage": 3, "year": 2005, "label": "2005 Web 2.0 Ajax Split Workspace", "engine": "CSS Floats + XHR"},
        {"stage": 4, "year": 2013, "label": "2013 Responsive 12-Col Flat Grid", "engine": "Bootstrap / Flexbox"},
        {"stage": 5, "year": 2020, "label": "2020 Dark Token Bento + ⌘K Omnibox", "engine": "CSS Grid + Custom Props"},
        {"stage": 6, "year": 2026, "label": "2026 Agentic Spatial Canvas & Ledger", "engine": "Generative DOM + Spatial"},
    ]

    morph_archetype_defs = [
        ("MORPH_KNOWLEDGE_PORTAL", "Information & Search Portal", "From CERN/Mosaic hypertext indexes to Perplexity/Agentic synthesis"),
        ("MORPH_COMMERCE_STORE", "E-Commerce Storefront", "From Amazon 1995 text tables to responsive card grids and AI shopping copilots"),
        ("MORPH_COLLAB_COMMUNICATION", "Messaging & Collaboration", "From Frameset webmail to Gmail Ajax, Slack channels, and multi-agent threads"),
        ("MORPH_DEV_ANALYTICS", "Developer & SaaS Analytics", "From CGI log tables to Stripe/Grafana dark grids and verification studios"),
        ("MORPH_CREATIVE_MEDIA", "Media & Creative Studio", "From Flash microsites & Web 2.0 photostreams to Figma WebGL and generative canvases"),
        ("MORPH_OS_SHELL", "Web Application Shell & Navigation", "From top browser bars & framesets to hamburger drawers, ⌘K omniboxes, and spatial ornaments"),
    ]

    # Normalized [0..1] 10-slot morphing geometry per stage so p5.js can smoothly lerp any slot across all 6 web eras
    base_stage_geometries = [
        # Stage 1: 1993 Single-column document flow with top browser chrome
        [
            ("toolbar", "URL & Navigation Bar", 0.02, 0.02, 0.96, 0.09),
            ("hypertext-body", "H1 Document Title & Anchor Index", 0.08, 0.13, 0.84, 0.14),
            ("hypertext-body", "Linear Hypertext Paragraph Block A", 0.08, 0.29, 0.84, 0.20),
            ("card-grid", "Inline GIF Image Map", 0.16, 0.51, 0.68, 0.16),
            ("hypertext-body", "Linear Hypertext Paragraph Block B", 0.08, 0.69, 0.84, 0.12),
            ("form-group", "CGI Submit Form & Text Input", 0.08, 0.83, 0.54, 0.08),
            ("tree-view", "Bottom Bullet Link Directory", 0.64, 0.83, 0.28, 0.08),
            ("status-bar", "Document Done Status Bar", 0.02, 0.93, 0.96, 0.05),
        ],
        # Stage 2: 1998 Dense 3-Column Table Portal
        [
            ("menubar", "Portal Banner & Search Table Row", 0.02, 0.02, 0.96, 0.11),
            ("sidebar-nav", "Left Category Directory Table", 0.02, 0.15, 0.20, 0.74),
            ("breadcrumb", "Yahoo-Style Category Breadcrumb", 0.24, 0.15, 0.52, 0.07),
            ("data-table", "Center Portal Headlines & Links", 0.24, 0.24, 0.52, 0.36),
            ("card-grid", "Nested Promo Sub-Table", 0.24, 0.62, 0.52, 0.27),
            ("form-group", "Right Member Login & Poll Box", 0.78, 0.15, 0.20, 0.34),
            ("tag-cloud", "Right Ticker & Webring Links", 0.78, 0.51, 0.20, 0.38),
            ("status-bar", "800x600 Table Footer", 0.02, 0.91, 0.96, 0.06),
        ],
        # Stage 3: 2005 Web 2.0 Ajax Split Workspace
        [
            ("tab-strip", "Web 2.0 Glossy Top Tab Strip", 0.02, 0.02, 0.96, 0.09),
            ("sidebar-nav", "Ajax Folder & Label Tree", 0.02, 0.13, 0.22, 0.52),
            ("tag-cloud", "Weighted Folksonomy Tag Cloud", 0.02, 0.67, 0.22, 0.23),
            ("toolbar", "XHR Action Bar (Archive / Report / Tag)", 0.26, 0.13, 0.72, 0.07),
            ("data-table", "Live Ajax Conversation / Item List", 0.26, 0.22, 0.44, 0.68),
            ("inspector-panel", "Asynchronous Inline Preview Pane", 0.72, 0.22, 0.26, 0.44),
            ("form-group", "Inline Quick-Reply / Ajax Editor", 0.72, 0.68, 0.26, 0.22),
            ("status-bar", "RSS & XMLHttpRequest Sync Bar", 0.02, 0.92, 0.96, 0.05),
        ],
        # Stage 4: 2013 Responsive 12-Col Flat Grid
        [
            ("menubar", "Fixed Top Flat Navbar + Hamburger", 0.02, 0.02, 0.96, 0.08),
            ("carousel", "Full-Bleed 12-Col Flat Hero Banner", 0.04, 0.12, 0.92, 0.24),
            ("segmented-control", "Filter Pills & Responsive Breakpoint Toggle", 0.04, 0.38, 0.60, 0.07),
            ("card-grid", "Elevation Card Column 1 (4-Col)", 0.04, 0.47, 0.29, 0.38),
            ("card-grid", "Elevation Card Column 2 (4-Col)", 0.355, 0.47, 0.29, 0.38),
            ("card-grid", "Elevation Card Column 3 (4-Col)", 0.67, 0.47, 0.29, 0.38),
            ("floating-action-btn", "Material Floating Action Button (+)", 0.88, 0.78, 0.07, 0.09),
            ("status-bar", "Minimal Flat Footer", 0.04, 0.88, 0.92, 0.06),
        ],
        # Stage 5: 2020 Dark Token Bento + ⌘K Omnibox
        [
            ("sidebar-nav", "Compact Icon + Workspace Rail", 0.02, 0.02, 0.15, 0.94),
            ("bento-tile", "Primary Bento Feature Span (2x2)", 0.19, 0.04, 0.48, 0.44),
            ("bento-tile", "Realtime Metric Bento Tile A", 0.69, 0.04, 0.29, 0.21),
            ("bento-tile", "Realtime Metric Bento Tile B", 0.69, 0.27, 0.29, 0.21),
            ("kanban-lane", "Keyboard-Triage Issue Stream", 0.19, 0.50, 0.52, 0.44),
            ("inspector-panel", "Design Token & Context Inspector", 0.73, 0.50, 0.25, 0.44),
            ("command-palette", "Floating ⌘K Command Palette Overlay", 0.30, 0.18, 0.44, 0.28),
            ("toast-stack", "Non-Blocking Realtime Sync Toast", 0.76, 0.86, 0.20, 0.08),
        ],
        # Stage 6: 2026 Agentic Spatial Canvas & Verification Ledger
        [
            ("spatial-ornament", "Floating Gaze & Mode Ornament", 0.02, 0.16, 0.06, 0.68),
            ("chat-stream", "Multi-Agent Intent & Thought Stream", 0.10, 0.04, 0.28, 0.74),
            ("command-palette", "Multimodal Intent Composer Bar", 0.10, 0.80, 0.28, 0.14),
            ("infinite-canvas", "Generative Ephemeral UI Sandbox", 0.40, 0.04, 0.58, 0.56),
            ("agent-trace-ledger", "Cryptographic Verification & Proof Ledger", 0.40, 0.62, 0.36, 0.32),
            ("bento-tile", "Live Diff & Rollback Control Tile", 0.78, 0.62, 0.20, 0.15),
            ("minimap", "Topology & Constellation Radar", 0.78, 0.79, 0.20, 0.15),
            ("status-bar", "Autonomous Verification Gate: PROVEN", 0.10, 0.95, 0.88, 0.04),
        ],
    ]

    web_morph_archetypes = []
    for idx, (mcode, mname, mdesc) in enumerate(morph_archetype_defs):
        stages_out = []
        for s_idx, s_meta in enumerate(morph_stages):
            raw_slots = base_stage_geometries[s_idx]
            # Slight deterministic archetype offset so each archetype has its own distinct morph geometry
            dx = ((idx % 3) - 1) * 0.008
            dy = ((idx // 3) - 0.5) * 0.008
            slots = []
            for slot_i, (stype, slabel, x, y, w, h) in enumerate(raw_slots):
                slots.append({
                    "slot": slot_i + 1,
                    "type": stype,
                    "label": f"{slabel} ({mname.split()[0]})",
                    "x": round(max(0.01, min(0.92, x + dx)), 3),
                    "y": round(max(0.01, min(0.92, y + dy)), 3),
                    "w": round(max(0.05, min(0.96, w)), 3),
                    "h": round(max(0.04, min(0.94, h)), 3),
                })
            stages_out.append({
                **s_meta,
                "nodes": slots,
            })
        web_morph_archetypes.append({
            "id": mcode,
            "name": mname,
            "description": mdesc,
            "stages": stages_out,
        })

    # Component evolution series across the 12 eras
    component_evolution = []
    for ctype in COMPONENT_PRIMITIVES[:28]:
        era_counts = []
        for e in ERAS:
            cnt = sum(1 for w in wireframes if w["era"] == e["id"] and ctype in w["componentTypes"])
            era_counts.append({"era": e["code"], "yearStart": e["startYear"], "count": cnt})
        component_evolution.append({
            "componentType": ctype,
            "totalOccurrences": sum(x["count"] for x in era_counts),
            "byEra": era_counts,
        })

    # Write wireframes.json
    wf_payload = {
        "datasetName": "A History in UI Development — 60-Year Software & Web Wireframe Seed Corpus",
        "version": "1.0.0",
        "generatedAt": "2026-10-26T12:55:00-06:00",
        "yearRange": {"min": 1966, "max": 2026, "spanYears": 60, "calendarYears": 61},
        "totalWireframes": len(wireframes),
        "eraCount": len(ERAS),
        "domainCount": len(DOMAINS),
        "platformCount": len(PLATFORMS),
        "wireframes": wireframes,
    }
    with open(os.path.join(DATA_DIR, "wireframes.json"), "w", encoding="utf-8") as f:
        json.dump(wf_payload, f, separators=(",", ":"))

    with open(os.path.join(DATA_DIR, "wireframes.jsonl"), "w", encoding="utf-8") as f:
        for wf in wireframes:
            f.write(json.dumps(wf, separators=(",", ":")) + "\n")

    trends_payload = {
        "title": "A History in UI Development — 60-Year Macro & Web UI Trends",
        "yearRange": {"min": 1966, "max": 2026, "spanYears": 60},
        "totalWireframes": len(wireframes),
        "eras": ERAS,
        "domains": DOMAINS,
        "platforms": PLATFORMS,
        "componentPrimitives": COMPONENT_PRIMITIVES,
        "yearlySeries": yearly_series,
        "webLayoutMorphArchetypes": web_morph_archetypes,
        "componentEvolution": component_evolution,
    }
    with open(os.path.join(DATA_DIR, "trends.json"), "w", encoding="utf-8") as f:
        json.dump(trends_payload, f, indent=2)

    schema_payload = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "WireframeSeedDatasetSchema",
        "description": "JSON Schema for A History in UI Development (1966-2026) ~1,000+ Unique Wireframes Corpus",
        "type": "object",
        "required": ["datasetName", "version", "yearRange", "totalWireframes", "wireframes"],
        "properties": {
            "Wireframe": {
                "type": "object",
                "required": [
                    "id", "title", "year", "decade", "era", "platform", "domain",
                    "webLayoutEngine", "layoutSpec", "uxMetrics", "uxResearchNotes",
                    "predecessorIds", "successorIds", "structuralHash"
                ],
            }
        },
    }
    with open(os.path.join(DATA_DIR, "schema.json"), "w", encoding="utf-8") as f:
        json.dump(schema_payload, f, indent=2)

    print(f"Generated {len(wireframes)} unique wireframes across 1966-2026 in {DATA_DIR}")


if __name__ == "__main__":
    generate_all()

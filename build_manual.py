"""Build a modern, professional PPTX user manual for the SAT-7 Promo Desk frontend."""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from datetime import date

from pathlib import Path

ROOT = Path(__file__).resolve().parent
SHOT_DIR = str(ROOT / 'docs' / 'manual' / 'screenshots')
OUT = str(ROOT / 'SAT7-Promo-Desk-User-Manual.pptx')

# ---------- Design tokens (mirror the app) ----------
BG      = RGBColor(0x0C, 0x12, 0x18)
SURFACE = RGBColor(0x14, 0x1C, 0x25)
SURF2   = RGBColor(0x1B, 0x25, 0x30)
BORDER  = RGBColor(0x26, 0x32, 0x3D)
WHITE   = RGBColor(0xEC, 0xF2, 0xF7)
MUTED   = RGBColor(0x9A, 0xA9, 0xB7)
FAINT   = RGBColor(0x6C, 0x7C, 0x8C)
RED     = RGBColor(0xE1, 0x44, 0x3A)
BLUE    = RGBColor(0x4A, 0x7B, 0xE6)
TEAL    = RGBColor(0x1E, 0x9E, 0x86)
AMBER   = RGBColor(0xEE, 0x9F, 0x2E)
VIOLET  = RGBColor(0x7C, 0x6C, 0xE0)

W, H = 13.333, 7.5
FONT = 'Segoe UI'

prs = Presentation()
prs.slide_width = Inches(W)
prs.slide_height = Inches(H)
blank = prs.slide_layouts[6]


# ---------- Helpers ----------
def rect(slide, x, y, w, h, fill=SURFACE, line=None, radius=True):
    shp = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,
        Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(0.75)
    if radius:
        try: shp.adjustments[0] = 0.08
        except Exception: pass
    return shp


def textbox(slide, x, y, w, h, text, size=14, color=WHITE, bold=False,
            align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP, font=FONT, spacing=1.0):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.02)
    tf.margin_top = tf.margin_bottom = Inches(0.01)
    tf.vertical_anchor = valign
    lines = text.split('\n')
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        r = p.add_run(); r.text = line
        r.font.size = Pt(size); r.font.bold = bold
        r.font.color.rgb = color; r.font.name = font
    return tb


def rich(slide, x, y, w, h, parts, size=14, spacing=1.08):
    """parts: list of (text, color, bold, size_override)"""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.02)
    tf.margin_top = tf.margin_bottom = Inches(0.01)
    for i, part in enumerate(parts):
        t, c, b = part[0], part[1], part[2]
        s = part[3] if len(part) > 3 else size
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.line_spacing = spacing
        p.space_after = Pt(4)
        r = p.add_run(); r.text = t
        r.font.size = Pt(s); r.font.bold = b
        r.font.color.rgb = c; r.font.name = FONT
    return tb


def new_slide(section, title, subtitle=None):
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, W, H, BG, radius=False)
    # Eyebrow
    textbox(s, 0.62, 0.36, 9, 0.28, section.upper(), 10.5, RED, True)
    textbox(s, 0.6, 0.66, 11.8, 0.56, title, 27, WHITE, True)
    if subtitle:
        textbox(s, 0.62, 1.20, 12, 0.3, subtitle, 12, MUTED)
    # accent line
    rect(s, 0.62, 1.52, 0.55, 0.045, RED, radius=False)
    return s


def footer(slide, n):
    textbox(slide, 0.62, 7.03, 7, 0.24, 'SAT-7 PROMO DESK  ·  FRONTEND USER MANUAL', 8.5, FAINT, True)
    textbox(slide, 11.9, 7.01, 0.85, 0.26, f'{n:02d}', 10, MUTED, True, PP_ALIGN.RIGHT)


def screenshot(slide, name, x, y, w, h=None):
    path = SHOT_DIR + '\\' + name + '.png'
    h = h if h is not None else w * 900 / 1440
    # frame
    rect(slide, x - 0.07, y - 0.07, w + 0.14, h + 0.14, SURFACE, BORDER)
    slide.shapes.add_picture(path, Inches(x), Inches(y), width=Inches(w), height=Inches(h))
    return h


def info_panel(slide, x, y, w, h, heading, bullets, accent=BLUE):
    rect(slide, x, y, w, h, SURFACE, BORDER)
    rect(slide, x, y, 0.055, h, accent, radius=False)
    textbox(slide, x + 0.28, y + 0.22, w - 0.5, 0.32, heading.upper(), 10.5, accent, True)
    body = '\n'.join('•  ' + b for b in bullets)
    textbox(slide, x + 0.28, y + 0.62, w - 0.55, h - 0.78, body, 11.5, WHITE, spacing=1.12)


def stat_card(slide, x, y, w, h, value, label, accent=BLUE):
    rect(slide, x, y, w, h, SURFACE, BORDER)
    textbox(slide, x + 0.2, y + 0.18, w - 0.4, 0.5, value, 25, accent, True)
    textbox(slide, x + 0.2, y + 0.78, w - 0.4, 0.3, label.upper(), 9.5, MUTED, True)


def pill(slide, x, y, w, text, color=RED):
    rect(slide, x, y, w, 0.32, color)
    textbox(slide, x, y + 0.045, w, 0.24, text, 9.5, WHITE, True, PP_ALIGN.CENTER)


# ============================================================
# 1 — COVER
# ============================================================
s = prs.slides.add_slide(blank)
rect(s, 0, 0, W, H, BG, radius=False)
rect(s, 0, 0, 0.16, H, RED, radius=False)
rect(s, 0.85, 1.15, 0.62, 0.62, RED)
textbox(s, 0.99, 1.28, 0.4, 0.3, 'S7', 16, WHITE, True, PP_ALIGN.CENTER)
textbox(s, 0.85, 2.15, 9.2, 0.9, 'SAT-7 Promo Desk', 44, WHITE, True)
textbox(s, 0.88, 3.15, 9.5, 0.5, 'Frontend User Manual', 25, RED, True)
rect(s, 0.88, 3.86, 2.2, 0.05, RED, radius=False)
textbox(s, 0.88, 4.16, 8.8, 1.0,
        'A complete guide to the modern web application for managing promo requests,\nproduction workflows, channels, programs, users and reports.',
        16, MUTED, spacing=1.25)
textbox(s, 0.88, 6.35, 8, 0.3, f'Version 1.0  ·  {date.today().strftime("%B %Y")}  ·  Internal use only', 11, FAINT)
# Cover visual — stacked screenshot card
rect(s, 9.35, 1.55, 3.25, 4.4, SURFACE, BORDER)
s.shapes.add_picture(SHOT_DIR + '\\dashboard.png', Inches(9.45), Inches(1.95), width=Inches(3.05), height=Inches(1.91))
s.shapes.add_picture(SHOT_DIR + '\\new.png', Inches(9.45), Inches(4.05), width=Inches(3.05), height=Inches(1.91))
textbox(s, 9.45, 1.65, 3, 0.24, 'PRODUCT PREVIEW', 9, RED, True)
footer(s, 1)


# ============================================================
# 2 — OVERVIEW
# ============================================================
s = new_slide('01 / Introduction', 'What is SAT-7 Promo Desk?',
              'One workspace for the entire promo request lifecycle — from intake to delivery.')
stat_card(s, 0.62, 1.85, 2.85, 1.25, '10', 'MODULES', RED)
stat_card(s, 3.65, 1.85, 2.85, 1.25, '19+', 'PROJECTS TRACKED', BLUE)
stat_card(s, 6.68, 1.85, 2.85, 1.25, '8', 'ROLES & TEAMS', VIOLET)
stat_card(s, 9.71, 1.85, 3.0, 1.25, '1', 'SHARED WORKSPACE', TEAL)
info_panel(s, 0.62, 3.45, 5.9, 3.25, 'Built for promo operations', [
    'Capture requests from email, manual entry or internal communication.',
    'Route work to programs, channels and the right team members.',
    'Follow every project through a 7-stage production pipeline.',
    'Keep a complete audit trail of every status change.',
], RED)
info_panel(s, 6.75, 3.45, 5.96, 3.25, 'What makes it modern', [
    'Dark-first design with semantic color tokens and calm, dense layouts.',
    'Command palette (Ctrl/⌘ + K) for instant navigation and search.',
    'Live notifications, activity feeds, charts and a real deadline calendar.',
    'Full CRUD for users, programs and channels with safe-delete guards.',
], BLUE)
footer(s, 2)


# ============================================================
# 3 — GETTING STARTED / LOGIN
# ============================================================
s = new_slide('02 / Getting started', 'Sign in & access',
              'Accounts are provisioned by an administrator — self-registration is intentionally disabled.')
screenshot(s, 'login', 0.62, 1.85, 7.4)
info_panel(s, 8.35, 1.85, 4.36, 2.25, 'How to sign in', [
    'Open the application URL in your browser.',
    'Enter your work email and password.',
    'Press Sign In — you will land on the Dashboard.',
], RED)
info_panel(s, 8.35, 4.25, 4.36, 2.4, 'Good to know', [
    'No “Create Account” option: admins create users in Users.',
    'Forgot access? Ask an administrator to reset your password.',
    'Sessions persist, so you return straight to the app.',
], BLUE)
footer(s, 3)


# ============================================================
# 4 — INTERFACE TOUR
# ============================================================
s = new_slide('03 / Interface tour', 'The application shell',
              'A collapsible sidebar, a smart topbar and a full-width content canvas.')
rect(s, 0.62, 1.85, 3.15, 4.85, SURFACE, BORDER)
textbox(s, 0.85, 2.05, 2.6, 0.3, 'SIDEBAR', 11, RED, True)
nav = ['Dashboard', 'Projects', 'New Request', 'Programs', 'Channels',
       'Production Board', 'Calendar', 'Users', 'Reports & Analytics', 'Settings']
for i, item in enumerate(nav):
    y = 2.45 + i * 0.40
    if i in (0, 2, 7):
        rect(s, 0.8, y - 0.04, 2.75, 0.35, SURF2, radius=False)
        rect(s, 0.8, y - 0.04, 0.045, 0.35, RED, radius=False)
    textbox(s, 0.98, y, 2.5, 0.26, item, 11.5, WHITE if i in (0, 2, 7) else MUTED)
textbox(s, 0.85, 6.45, 2.6, 0.24, 'Collapse  ·  ⌘K search', 9, FAINT)

info_panel(s, 4.0, 1.85, 4.35, 2.3, 'Topbar', [
    'Command search — Ctrl/⌘ + K.',
    'Notification center with unread count.',
    'Dark / light theme toggle.',
    'Account menu with sign out.',
], BLUE)
info_panel(s, 4.0, 4.3, 4.35, 2.4, 'Sidebar', [
    'One-click collapse to icon-only mode.',
    'Your choice is remembered on this device.',
    'Active page marked with a red accent bar.',
    'Quick search pinned at the bottom.',
], RED)
info_panel(s, 8.58, 1.85, 4.13, 4.85, 'Content canvas', [
    'Full-width layouts up to 1600px.',
    'Consistent “panel” cards with thin borders.',
    'Eyebrow + title + helper text on every page.',
    'Semantic colors: blue = new, amber = progress, violet = review, teal = done, red = urgent.',
    'Tabular numerals keep tables and KPIs aligned.',
], TEAL)
footer(s, 4)


# ============================================================
# 5 — DASHBOARD
# ============================================================
s = new_slide('04 / Core modules', 'Dashboard',
              'Your daily command centre — live metrics, pipeline health, activity and deadlines.')
screenshot(s, 'dashboard', 0.62, 1.9, 7.7)
info_panel(s, 8.65, 1.9, 4.06, 2.35, 'At a glance', [
    '10 KPI cards: total, new, in progress, review, completed, overdue and more.',
    'Segmented pipeline bar shows status distribution.',
    'Channel and program breakdowns with ranked bars.',
], RED)
info_panel(s, 8.65, 4.4, 4.06, 2.25, 'Live context', [
    'Recent activity feed with actor, project and status.',
    'Real upcoming deadlines pulled from project due dates.',
    'Team roster with roles and active status.',
], BLUE)
footer(s, 5)


# ============================================================
# 6 — COMMAND PALETTE
# ============================================================
s = new_slide('05 / Power features', 'Command palette',
              'The fastest way to move around the app — every page, action and project in one keystroke.')
screenshot(s, 'command-palette', 0.62, 1.9, 7.7)
info_panel(s, 8.65, 1.9, 4.06, 2.3, 'Open it', [
    'Press Ctrl + K (Windows) or ⌘ + K (Mac).',
    'Or click “Search projects, actions…” in the topbar.',
    'Or use “Quick search” at the bottom of the sidebar.',
], RED)
info_panel(s, 8.65, 4.35, 4.06, 2.3, 'Use it', [
    'Type to fuzzy-search pages, actions and live projects.',
    '↑ / ↓ to move, Enter to open, Esc to close.',
    'Recently used items appear before you type anything.',
    'Project results deep-link into the filtered Projects list.',
], BLUE)
footer(s, 6)


# ============================================================
# 7 — PROJECTS
# ============================================================
s = new_slide('04 / Core modules', 'Projects',
              'Find any request quickly, inspect its details and move it through the pipeline.')
screenshot(s, 'projects', 0.62, 1.9, 7.7)
info_panel(s, 8.65, 1.9, 4.06, 2.35, 'Find & filter', [
    'Search by project code or requester email.',
    'Filter by status, program, channel, priority or assignee.',
    'Live KPI strip updates with the current filters.',
    'Working pagination — 15 projects per page.',
], RED)
info_panel(s, 8.65, 4.4, 4.06, 2.25, 'Detail drawer', [
    'Click a project code or “View” to slide out its details.',
    'See program, channels, team, notes and dates.',
    'Change status from any of the 10 pipeline stages.',
], BLUE)
footer(s, 7)


# ============================================================
# 8 — NEW REQUEST
# ============================================================
s = new_slide('04 / Core modules', 'New Promo Request',
              'A guided, four-step form with a live summary that updates as you fill it in.')
screenshot(s, 'new', 0.62, 1.85, 7.9)
info_panel(s, 8.8, 1.85, 3.91, 4.95, 'The four steps', [
    '1 — Requester details: name, department, source, email and phone.',
    '2 — Promo details: program, type, deadline, priority and notes.',
    '3 — Channels: toggle every channel the promo should air on.',
    '4 — Assignment: optionally assign team members.',
    'The sticky sidebar previews your choices before submitting.',
    'The project ID is generated automatically on submit.',
], RED)
footer(s, 8)


# ============================================================
# 9 — PROGRAMS & CHANNELS
# ============================================================
s = new_slide('06 / Reference data', 'Programs & Channels',
              'Manage the building blocks every request depends on — with delete safeguards.')
screenshot(s, 'programs', 0.62, 1.9, 5.75)
screenshot(s, 'channels', 6.85, 1.9, 5.75)
info_panel(s, 0.62, 5.68, 5.85, 1.2, 'Program deletion', [
    'If projects use it, choose a replacement — they are reassigned automatically.',
], RED)
info_panel(s, 6.85, 5.68, 5.85, 1.2, 'Channel deletion', [
    'Its ID is removed from every project’s channel list; projects stay intact.',
], BLUE)
footer(s, 9)


# ============================================================
# 10 — PRODUCTION BOARD
# ============================================================
s = new_slide('04 / Core modules', 'Production Board',
              'A horizontal kanban that turns pipeline status into a hands-on workflow.')
screenshot(s, 'production', 0.62, 1.9, 7.7)
info_panel(s, 8.65, 1.9, 4.06, 2.35, 'Drag to update', [
    'Seven stages: New → Pending → Assigned → In Progress → Review → Approved → Completed.',
    'Drag a card into another column to change its status.',
    'The change is saved immediately to the database.',
], RED)
info_panel(s, 8.65, 4.4, 4.06, 2.25, 'Card contents', [
    'Project code, priority badge, program, due date and channel count.',
    'A pipeline strip shows progress within the current stage.',
    'KPI strip summarises production, review and completion.',
], BLUE)
footer(s, 10)


# ============================================================
# 11 — CALENDAR
# ============================================================
s = new_slide('04 / Core modules', 'Calendar',
              'Every project deadline on one timeline — month, week or day.')
screenshot(s, 'calendar', 0.62, 1.9, 7.7)
info_panel(s, 8.65, 1.9, 4.06, 2.35, 'Views & navigation', [
    'Month grid with coloured deadline chips.',
    'Week view lists deadlines day by day.',
    'Day view focuses on a single date.',
    'Today button and previous / next controls.',
], RED)
info_panel(s, 8.65, 4.4, 4.06, 2.25, 'Deadlines', [
    'Events come from real project due dates — no sample data.',
    'Colour encodes urgency: red, amber, blue or teal for done.',
    'Click any event to open that project in the Projects list.',
], BLUE)
footer(s, 11)


# ============================================================
# 12 — REPORTS
# ============================================================
s = new_slide('04 / Core modules', 'Reports & Analytics',
              'Live insight into volume, delivery and team workload — no stale numbers.')
screenshot(s, 'reports', 0.62, 1.9, 7.7)
info_panel(s, 8.65, 1.9, 4.06, 2.4, 'Metrics included', [
    'Completion rate donut and five headline KPIs.',
    'Projects by channel and by program bar charts.',
    'Pipeline distribution across all statuses.',
], RED)
info_panel(s, 8.65, 4.45, 4.06, 2.2, 'Operational views', [
    'Team workload ranked by active assignments.',
    'Upcoming deadlines and a recent activity feed.',
    'Everything is computed from the live database.',
], BLUE)
footer(s, 12)


# ============================================================
# 13 — USERS
# ============================================================
s = new_slide('07 / Administration', 'Users & access control',
              'Administrator-only management of accounts, roles, departments and passwords.')
screenshot(s, 'users', 0.62, 1.9, 7.7)
info_panel(s, 8.65, 1.9, 4.06, 2.35, 'What admins can do', [
    'Create an account — a temporary password is generated and shown once.',
    'Edit name, role, department, phone and active status.',
    'Deactivate or delete a user, with self-delete and last-admin guards.',
    'Reset any user’s password and copy the new one.',
], RED)
info_panel(s, 8.65, 4.4, 4.06, 2.25, 'Safety notes', [
    'Non-admins see a read-only list with no action buttons.',
    'Deleting a user warns that history entries lose attribution.',
    'Sign-up on the login page is disabled by design.',
], BLUE)
footer(s, 13)


# ============================================================
# 14 — SETTINGS
# ============================================================
s = new_slide('07 / Administration', 'Settings',
              'Organization details, notification preferences and device appearance.')
screenshot(s, 'settings', 0.62, 1.9, 7.7)
info_panel(s, 8.65, 1.9, 4.06, 2.35, 'Organization & alerts', [
    'Edit the organization name shown across the desk.',
    'Toggle email notifications for new requests and status changes.',
    'Toggle WhatsApp alerts for overdue projects.',
], RED)
info_panel(s, 8.65, 4.4, 4.06, 2.25, 'Appearance', [
    'Choose Light or Dark with large visual previews.',
    'Your choice is saved on this device and applied before the page paints — no flash.',
    'The topbar toggle and Settings stay in sync.',
], BLUE)
footer(s, 14)


# ============================================================
# 15 — DESIGN SYSTEM
# ============================================================
s = new_slide('08 / Under the hood', 'Design system',
              'A small token set drives the entire interface — rebranding is a one-file change.')
info_panel(s, 0.62, 1.85, 3.85, 4.85, 'Surface tokens', [
    'bg — page background',
    'surface — card background',
    'surface-2 — subtle raised areas',
    'border — thin 1px separators',
    'text / text-dim / text-faint — type hierarchy',
], RED)
info_panel(s, 4.62, 1.85, 3.85, 4.85, 'State tokens', [
    'blue — new / informational',
    'amber — in progress / due soon',
    'violet — assigned / review',
    'teal — approved / completed',
    'red — urgent / overdue / destructive',
], BLUE)
info_panel(s, 8.62, 1.85, 4.09, 4.85, 'Interaction patterns', [
    'Minimal chrome: thin borders, small radii, no heavy shadows.',
    'Tabular numerals in tables and KPIs.',
    'Skeleton loaders while data arrives.',
    'Focus rings and reduced-motion support.',
    'Responsive: desktop-first, tables scroll on narrow screens.',
], TEAL)
footer(s, 15)


# ============================================================
# 16 — QUICK REFERENCE
# ============================================================
s = new_slide('09 / Quick reference', 'Shortcuts & common workflows',
              'The everyday moves that make the desk fast to use.')
info_panel(s, 0.62, 1.85, 3.85, 4.85, 'Keyboard', [
    'Ctrl / ⌘ + K — open command palette',
    '↑ / ↓ — move through results',
    'Enter — open highlighted result',
    'Esc — close palette or dialog',
], RED)
info_panel(s, 4.62, 1.85, 3.85, 4.85, 'Common workflows', [
    'New request → fill 4 steps → Submit → open project.',
    'Projects → filter → View → change status.',
    'Production → drag card to next stage.',
    'Users → Create → share generated password.',
], BLUE)
info_panel(s, 8.62, 1.85, 4.09, 4.85, 'Tips', [
    'Deep links like /projects?q=PR-2026-00019 open a filtered list.',
    'Notifications and palette results open the related project.',
    'Collapsed sidebar and theme are remembered per device.',
    'Administrator role is required for user management.',
], TEAL)
footer(s, 16)


# ============================================================
# 17 — CLOSE
# ============================================================
s = prs.slides.add_slide(blank)
rect(s, 0, 0, W, H, BG, radius=False)
rect(s, 0, 0, 0.16, H, RED, radius=False)
textbox(s, 0.85, 2.05, 10, 0.4, 'END OF MANUAL', 11, RED, True)
textbox(s, 0.85, 2.6, 11, 0.8, 'Ready to get productive?', 38, WHITE, True)
rect(s, 0.88, 3.6, 2.2, 0.05, RED, radius=False)
textbox(s, 0.88, 3.95, 10.5, 1.2,
        'Open the app, sign in with your SAT-7 account, and press Ctrl / ⌘ + K\nto jump straight to whatever you need.',
        17, MUTED, spacing=1.3)
rect(s, 0.88, 5.6, 11.55, 0.9, SURFACE, BORDER)
textbox(s, 1.15, 5.78, 11, 0.55,
        'Need access or a password reset? Contact your Promo Desk administrator.',
        14, WHITE, True, valign=MSO_ANCHOR.MIDDLE)
footer(s, 17)

prs.save(OUT)
print('Saved:', OUT)
print('Slides:', len(prs.slides._sldIdLst))

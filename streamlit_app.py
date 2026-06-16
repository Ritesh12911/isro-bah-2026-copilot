import streamlit as st
import streamlit.components.v1 as components
import os

# Set wide layout and dashboard title
st.set_page_config(
    page_title="AetherNOC // Secure Predictive MPLS Copilot",
    page_icon="🛰️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS to hide Streamlit header, footer, and sidebar toggle for a cleaner dashboard look
st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        .block-container {
            padding-top: 0rem;
            padding-bottom: 0rem;
            padding-left: 0rem;
            padding-right: 0rem;
        }
        iframe {
            display: block;
            border: none;
        }
    </style>
""", unsafe_allow_html=True)

# Read HTML, CSS, and JS files to compile a single offline-capable component
def load_dashboard():
    dir_path = os.path.dirname(os.path.abspath(__file__))
    
    html_path = os.path.join(dir_path, "index.html")
    css_path = os.path.join(dir_path, "styles.css")
    js_path = os.path.join(dir_path, "app.js")
    
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()
        
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()
        
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()
        
    # Inject CSS before the closing </head>
    css_injection = f"<style>{css}</style>"
    html = html.replace("</head>", f"{css_injection}</head>")
    
    # Inject JS and remove the external script reference
    html = html.replace('<script src="app.js"></script>', "")
    js_injection = f"<script>{js}</script>"
    html = html.replace("</body>", f"{js_injection}</body>")
    
    return html

try:
    dashboard_html = load_dashboard()
    # Render full-bleed dashboard components
    components.html(dashboard_html, height=880, scrolling=False)
except Exception as e:
    st.error(f"Error loading AetherNOC Dashboard components: {e}")

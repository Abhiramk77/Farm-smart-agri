import os, re

def process_file(path, regexes):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for p, repl in regexes:
        content = re.sub(p, repl, content, flags=re.DOTALL)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# Frontend files
process_file('frontend/src/App.tsx', [
    (r'import\s+\{\s*Chat\s*\}\s*from\s*\'\./pages/Chat\';\n?', ''),
    (r'<Route\s+path="/chat"\s+element=\{.*?</ProtectedRoute>\s*\}\s*/>\s*', '')
])

process_file('frontend/src/components/Layout.tsx', [
    (r'\{\s*icon:\s*MessageSquare,\s*label:\s*\'Chat\',\s*path:\s*\'/chat\',?\s*\},?\n?', '')
])

process_file('frontend/src/pages/farmer/ContractDetail.tsx', [
    (r'<button\s+onClick=\{[^}]*navigate\(\'/chat\'\)[^>]*>.*?Message Buyer\s*</button>\n?', ''),
    (r'<button\s+onClick=\{[^}]*navigate\(\'/chat\'\)[^>]*>.*?<MessageSquare[^>]*/>.*?Message\s*</button>\n?', '')
])

process_file('frontend/src/data/mockData.ts', [
    (r'export const MOCK_CHATS\s*=\s*\[.*?\];\s*', '')
])

process_file('frontend/src/api/services.ts', [
    (r'export interface ChatThread\s*\{.*?\}(?=\n\n|\Z)\s*', ''),
    (r'export const chatService\s*=\s*\{.*?\};\s*(?=\n\n|\Z)', '')
])

if os.path.exists('frontend/src/pages/Chat.tsx'):
    os.remove('frontend/src/pages/Chat.tsx')

# Flutter files
process_file('smart_agri_app/lib/main.dart', [
    # Remove ChatThread model
    (r'class ChatThread\s*\{.*?\n\}\n*', ''),
    # Remove mockStore.chats
    (r'\s*List<ChatThread>\s+get\s+chats\s*=>\s*\[.*?\];\n*', ''),
    # Remove ChatPage class entirely
    (r'// ─── CHAT PAGE ─+.*?(?=// ───|$)', ''),
    # Remove ChatPage route in bottom navigation (BuyerShell)
    (r'const ChatPage\(\),?\s*', ''),
    # Remove BottomNavigationBarItem for Chat
    (r'BottomNavigationBarItem\(\s*icon:\s*Icon\(Icons\.chat_bubble_outline\),\s*selectedIcon:\s*Icon\(Icons\.chat_bubble\),\s*label:\s*\'Chat\'\),?\s*', ''),
])

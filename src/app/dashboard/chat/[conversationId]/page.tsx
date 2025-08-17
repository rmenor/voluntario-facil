import ChatLayout from '@/components/chat/ChatLayout';
import { getConversationsForUser, getPopulatedConversation, getUsers } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';

// This is a server component that will fetch initial data
export default async function ChatConversationPage({ params }: { params: { conversationId: string }}) {
    // In a real app, you'd get the logged-in user's ID from the session.
    // We'll use a default user ('2') for the mock data fetching.
    const userId = '2'; // This should be dynamic based on logged in user
    const { conversationId } = params;
    
    // We pass both the list and the selected one to avoid waterfall requests on the client
    const conversations = await getConversationsForUser(userId);
    const selectedConversation = await getPopulatedConversation(conversationId, userId);
    
    return (
        <ChatLayout 
            initialConversations={conversations} 
            initialSelectedConversation={selectedConversation}
        />
    );
}

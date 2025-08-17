import ChatLayout from '@/components/chat/ChatLayout';
import { getConversationsForUser } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';

// This is a server component that will fetch initial data
export default async function ChatPage() {
    // In a real app, you'd get the logged-in user's ID from the session.
    // For this mock, we'll fetch conversations for a default user (e.g., user '2').
    // The ChatLayout component will then manage its own state on the client.
    const initialConversations = await getConversationsForUser('2');

    return <ChatLayout initialConversations={initialConversations} />;
}

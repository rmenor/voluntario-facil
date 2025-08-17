'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import AppHeader from '@/components/layout/AppHeader';
import { getConversationsForUser, getPopulatedConversation, getUsers } from '@/lib/data';
import type { Conversation, PopulatedConversation, User } from '@/lib/types';
import { Loader2, Send, CornerUpLeft, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useActionState, useTransition } from 'react';
import { sendMessage } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
};

function SendMessageForm({ conversation, user }: { conversation: PopulatedConversation, user: User }) {
    const [message, setMessage] = useState('');
    const { toast } = useToast();
    const [state, formAction, isPending] = useActionState(sendMessage, { success: false, error: null });

    useEffect(() => {
        if(state.success) {
            setMessage('');
        } else if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error })
        }
    }, [state, toast]);

    return (
        <form action={formAction} className="flex items-center gap-2 p-4 border-t bg-background">
            <input type="hidden" name="conversationId" value={conversation.id} />
            <input type="hidden" name="senderId" value={user.id} />
            <Input 
                name="message" 
                placeholder="Escribe un mensaje..." 
                className="flex-1" 
                autoComplete="off"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <Button type="submit" size="icon" disabled={isPending || !message}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
        </form>
    );
}

export default function ChatLayout({ initialConversations, initialSelectedConversation }: { initialConversations: Conversation[], initialSelectedConversation?: PopulatedConversation | null }) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const params = useParams();

    const [conversations, setConversations] = useState(initialConversations);
    const [selectedConversation, setSelectedConversation] = useState(initialSelectedConversation);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isFetchingConversations, setIsFetchingConversations] = useState(true);
    const [isFetchingMessages, setIsFetchingMessages] = useState(false);

    const conversationId = params.conversationId as string | undefined;

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
          router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    // This effect ensures client-side navigation updates the selected conversation
    useEffect(() => {
        async function fetchSelected() {
            if (conversationId && user) {
                // If the selected conversation is already loaded, don't refetch
                if(selectedConversation?.id === conversationId) return;

                setIsFetchingMessages(true);
                const conv = await getPopulatedConversation(conversationId, user.id);
                setSelectedConversation(conv);
                setIsFetchingMessages(false);
            } else {
                setSelectedConversation(undefined);
            }
        }
        fetchSelected();
    }, [conversationId, user, selectedConversation?.id]);
    
    // This effect ensures the conversation list is fresh
     useEffect(() => {
        if (user) {
            setIsFetchingConversations(true);
            Promise.all([
                getConversationsForUser(user.id),
                getUsers()
            ]).then(([convs, users]) => {
                setConversations(convs);
                setAllUsers(users);
                setIsFetchingConversations(false);
            })
        }
    }, [user, conversationId]); // re-fetch list when a conversation is selected to update last message

    if (isLoading || !isAuthenticated || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-screen">
            <AppHeader />
            <main className="flex-1 flex overflow-hidden">
                <aside className="w-full md:w-80 border-r flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-bold">Conversaciones</h2>
                    </div>
                     <ScrollArea className="flex-1">
                        {isFetchingConversations ? (
                             <div className="p-4 space-y-4">
                                {[...Array(5)].map((_, i) => <Loader2 key={i} className="h-5 w-5 animate-spin"/>)}
                            </div>
                        ) : (
                            <nav className="p-2 space-y-1">
                                {conversations.map(conv => {
                                    const otherParticipantIds = conv.participantIds.filter(pId => pId !== user.id);
                                    const otherParticipants = allUsers.filter(u => otherParticipantIds.includes(u.id));
                                    const convName = conv.name || otherParticipants.map(p => p.name).join(', ') || 'Conversación';
                                    const lastMessageText = conv.lastMessage?.text || 'No hay mensajes todavía.';
                                    
                                    return (
                                        <Link key={conv.id} href={`/dashboard/chat/${conv.id}`} className={cn(
                                            "flex flex-col p-3 rounded-lg hover:bg-muted/50 transition-colors",
                                            conversationId === conv.id && "bg-muted"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${convName}`} />
                                                    <AvatarFallback>{getInitials(convName)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-semibold truncate">{convName}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{lastMessageText}</p>
                                                </div>
                                                {conv.lastMessage && (
                                                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(conv.lastMessage.timestamp), { locale: es, addSuffix: true })}
                                                    </time>
                                                )}
                                            </div>
                                        </Link>
                                    )
                                })}
                            </nav>
                        )}
                    </ScrollArea>
                </aside>

                <section className="flex-1 flex flex-col">
                   {isFetchingMessages ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                   ) : selectedConversation ? (
                        <>
                           <header className="p-4 border-b flex items-center gap-4">
                                <Link href="/dashboard/chat" className="md:hidden">
                                    <Button variant="ghost" size="icon">
                                        <CornerUpLeft className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <Avatar>
                                    <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${selectedConversation.name}`} />
                                    <AvatarFallback>{getInitials(selectedConversation.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{selectedConversation.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedConversation.participants.map(p => p.name).join(', ')}</p>
                                </div>
                            </header>

                             <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                {selectedConversation.messages.map(msg => {
                                    const sender = selectedConversation.participants.find(p => p.id === msg.senderId);
                                    const isMe = msg.senderId === user.id;

                                    return (
                                        <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                                            {!isMe && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${sender?.name}`} />
                                                    <AvatarFallback>{sender ? getInitials(sender.name) : '?'}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={cn(
                                                "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl",
                                                isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                                            )}>
                                                {!isMe && <p className="text-xs font-semibold mb-1">{sender?.name}</p>}
                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                                <p className="text-xs opacity-70 mt-1 text-right">{format(new Date(msg.timestamp), 'HH:mm')}</p>
                                            </div>
                                             {isMe && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${sender?.name}`} />
                                                    <AvatarFallback>{sender ? getInitials(sender.name) : '?'}</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    )
                                })}
                                </div>
                            </ScrollArea>
                            <SendMessageForm conversation={selectedConversation} user={user} />
                        </>
                   ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground" />
                                <h2 className="mt-4 text-xl font-semibold">Selecciona una conversación</h2>
                                <p className="text-muted-foreground mt-1">Elige una conversación de la lista para ver los mensajes.</p>
                            </div>
                        </div>
                   )}
                </section>
            </main>
        </div>
    );
}

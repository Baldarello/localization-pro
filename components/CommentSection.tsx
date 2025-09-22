import React, { useState, useMemo, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, TextField, Button, Avatar, Paper, Popover, List, ListItemButton, ListItemAvatar, ListItemText, Collapse, Skeleton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useStores } from '../stores/StoreProvider';
import { Comment, User } from '../types';

const CommentForm: React.FC<{
    onSubmit: (content: string) => void;
    onCancel?: () => void;
    submitLabel: string;
    placeholder: string;
}> = ({ onSubmit, onCancel, submitLabel, placeholder }) => {
    const { projectStore, uiStore, authStore } = useStores();
    const [content, setContent] = useState('');
    const [mentionedUsers, setMentionedUsers] = useState<Map<string, User>>(new Map());
    const typingTimeoutRef = useRef<number | null>(null);

    // State for the @mention popover
    const [mentionAnchor, setMentionAnchor] = useState<HTMLElement | null>(null);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);

    const teamMembers = useMemo(() => {
        if (!projectStore.selectedProject) return [];
        const memberIds = Object.keys(projectStore.selectedProject.team);
        return projectStore.allUsers.filter(u => memberIds.includes(u.id));
    }, [projectStore.selectedProject, projectStore.allUsers]);

    const filteredMembers = useMemo(() => {
        if (!mentionQuery) return teamMembers;
        const lowerCaseQuery = mentionQuery.toLowerCase();
        return teamMembers.filter(user =>
            user.name.toLowerCase().includes(lowerCaseQuery) ||
            user.email.toLowerCase().includes(lowerCaseQuery)
        );
    }, [mentionQuery, teamMembers]);

    // Effect for handling typing indicators
    useEffect(() => {
        const { selectedProject, selectedTerm, currentBranch } = projectStore;
        const currentUser = authStore.currentUser;
        
        if (!selectedProject || !selectedTerm || !currentBranch || !currentUser) return;

        const payload = {
            projectId: selectedProject.id,
            branchName: currentBranch.name,
            termId: selectedTerm.id,
            userName: currentUser.name,
        };
        
        // Clear previous timeout if it exists
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (content) {
            // User is typing
            uiStore.sendWebSocketMessage({ type: 'client_typing_start', payload });
        }

        // Set a new timeout to signal "stop typing"
        typingTimeoutRef.current = window.setTimeout(() => {
            uiStore.sendWebSocketMessage({ type: 'client_typing_stop', payload });
        }, 2000); // 2 seconds of inactivity

        // Cleanup on unmount
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            // Ensure we send a "stop" message if the component unmounts while typing
            if (content) {
                 uiStore.sendWebSocketMessage({ type: 'client_typing_stop', payload });
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, projectStore.selectedTerm]);


    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;
        setContent(value);

        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');
        const lastSpace = textBeforeCursor.lastIndexOf(' ');

        if (lastAt > lastSpace) {
            const query = textBeforeCursor.substring(lastAt + 1);
            setMentionQuery(query);
            setMentionStartIndex(lastAt);
            setMentionAnchor(e.currentTarget);
        } else {
            setMentionAnchor(null);
        }
    };

    const handleMentionSelect = (user: User) => {
        const textBeforeMention = content.substring(0, mentionStartIndex);
        const textAfterMention = content.substring(mentionStartIndex + 1 + mentionQuery.length);
        const newContent = `${textBeforeMention}@${user.name} ${textAfterMention}`;
        
        setContent(newContent);
        setMentionedUsers(prev => new Map(prev).set(user.name, user)); // Store user object to resolve back to email on submit
        setMentionAnchor(null);
        setMentionQuery('');
        setMentionStartIndex(-1);
    };

    const processAndSubmit = () => {
        if (content.trim()) {
            let processedContent = content.trim();
            // Convert @username mentions back to @email.com for the backend
            mentionedUsers.forEach((user, name) => {
                // Escape special regex characters in the name before creating the RegExp
                const escapedName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const mentionRegex = new RegExp(`@${escapedName}(?=\\s|$)`, 'g');
                processedContent = processedContent.replace(mentionRegex, `@${user.email}`);
            });

            onSubmit(processedContent);
            setContent('');
            setMentionedUsers(new Map());
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processAndSubmit();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !mentionAnchor) {
            e.preventDefault();
            processAndSubmit();
        }
    };

    return (
        <Box>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus={!!onCancel}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {onCancel && <Button onClick={onCancel}>Cancel</Button>}
                    <Button type="submit" variant="contained" disabled={!content.trim()}>{submitLabel}</Button>
                </Box>
            </Box>
             <Popover
                open={Boolean(mentionAnchor)}
                anchorEl={mentionAnchor}
                onClose={() => setMentionAnchor(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                disableAutoFocus
                disableEnforceFocus
                PaperProps={{ style: { marginTop: '8px', width: '300px', maxHeight: '200px' } }}
            >
                <List dense>
                    {filteredMembers.length > 0 ? (
                        filteredMembers.map(user => (
                            <ListItemButton key={user.id} onClick={() => handleMentionSelect(user)}>
                                <ListItemAvatar>
                                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>{user.avatarInitials}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={user.name} secondary={user.email} />
                            </ListItemButton>
                        ))
                    ) : (
                         <ListItemText primary="No matching users found" sx={{ p: 2 }}/>
                    )}
                </List>
            </Popover>
        </Box>
    );
};


const CommentView: React.FC<{ comment: Comment }> = observer(({ comment }) => {
    const { projectStore } = useStores();
    const { addComment, allUsers } = projectStore;
    const [isReplying, setIsReplying] = useState(false);
    const [repliesOpen, setRepliesOpen] = useState(true);
    
    const handleReplySubmit = async (content: string) => {
        await addComment(content, comment.id);
        setIsReplying(false);
    };

    const processedContent = useMemo(() => {
        const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(comment.content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(comment.content.substring(lastIndex, match.index));
            }

            const email = match[1];
            const user = allUsers.find(u => u.email === email);
            const mentionText = user ? `@${user.name}` : match[0];

            parts.push(
                <Typography component="span" key={`mention-${match.index}`} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {mentionText}
                </Typography>
            );

            lastIndex = mentionRegex.lastIndex;
        }

        if (lastIndex < comment.content.length) {
            parts.push(comment.content.substring(lastIndex));
        }

        return parts.length > 0 ? parts : [comment.content];
    }, [comment.content, allUsers]);

    return (
        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Avatar sx={{ bgcolor: 'secondary.main', mt: 1 }}>{comment.author.avatarInitials}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{comment.author.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(comment.createdAt).toLocaleString()}
                    </Typography>
                </Box>
                <Paper variant="outlined" sx={{ p: 1.5, my: 0.5, bgcolor: 'action.hover', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {processedContent.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}
                </Paper>
                <Button size="small" onClick={() => setIsReplying(!isReplying)}>
                    {isReplying ? 'Cancel' : 'Reply'}
                </Button>
                {isReplying && (
                    <CommentForm
                        onSubmit={handleReplySubmit}
                        onCancel={() => setIsReplying(false)}
                        submitLabel="Post Reply"
                        placeholder="Write your reply..."
                    />
                )}
                {comment.replies && comment.replies.length > 0 && (
                    <>
                        <Button
                            size="small"
                            onClick={() => setRepliesOpen(!repliesOpen)}
                            startIcon={repliesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{ ml: 1, color: 'text.secondary' }}
                        >
                            {repliesOpen ? 'Hide replies' : `Show ${comment.replies.length} replies`}
                        </Button>
                        <Collapse in={repliesOpen} timeout="auto" unmountOnExit>
                            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                {comment.replies.map(reply => (
                                    <CommentView key={reply.id} comment={reply} />
                                ))}
                            </Box>
                        </Collapse>
                    </>
                )}
            </Box>
        </Box>
    );
});


const CommentSection: React.FC = observer(() => {
    const { projectStore, authStore } = useStores();
    const { selectedTermComments, addComment, typingUsersOnSelectedTerm, selectedTerm, isFetchingComments } = projectStore;

    const handleCommentSubmit = async (content: string) => {
        await addComment(content, null);
    };

    // Filter out the current user from the list of typers
    const otherTypingUsers = useMemo(() => {
        return Array.from(typingUsersOnSelectedTerm.entries())
            .filter(([userId]) => userId !== authStore.currentUser?.id)
            .map(([, userName]) => userName);
    }, [typingUsersOnSelectedTerm, authStore.currentUser?.id]);
    
    // Clear typing users when the selected term changes
    useEffect(() => {
        return () => {
            projectStore.typingUsersOnSelectedTerm.clear();
        };
    }, [selectedTerm, projectStore.typingUsersOnSelectedTerm]);


    const typingIndicatorText = useMemo(() => {
        if (otherTypingUsers.length === 0) return '';
        if (otherTypingUsers.length === 1) return `${otherTypingUsers[0]} is typing...`;
        if (otherTypingUsers.length === 2) return `${otherTypingUsers.join(' and ')} are typing...`;
        return `${otherTypingUsers.slice(0, 2).join(', ')} and others are typing...`;
    }, [otherTypingUsers]);

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h4">Comments</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', height: '20px' }}>
                    {typingIndicatorText}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {isFetchingComments ? (
                    Array.from(new Array(2)).map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2, width: '100%' }}>
                            <Skeleton variant="circular" width={40} height={40} sx={{ mt: 1 }} />
                            <Box sx={{ flexGrow: 1 }}>
                                <Skeleton variant="text" sx={{ fontSize: '1rem', width: '30%' }} />
                                <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
                            </Box>
                        </Box>
                    ))
                ) : selectedTermComments.length > 0 ? (
                    selectedTermComments.map(comment => (
                        <CommentView key={comment.id} comment={comment} />
                    ))
                ) : (
                    <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No comments yet. Start the conversation!
                    </Typography>
                )}
            </Box>
            <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Add a Comment</Typography>
                 <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Mention users with @, submit with Enter, new line with Ctrl+Enter.
                </Typography>
                <CommentForm
                    onSubmit={handleCommentSubmit}
                    submitLabel="Post Comment"
                    placeholder="Ask a question or leave a note..."
                />
            </Box>
        </Box>
    );
});

export default CommentSection;
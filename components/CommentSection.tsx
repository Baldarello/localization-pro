
import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, TextField, Button, Avatar, Paper, Popover, List, ListItemButton, ListItemAvatar, ListItemText, Collapse } from '@mui/material';
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
    const { projectStore } = useStores();
    const [content, setContent] = useState('');
    const [mentionedUsers, setMentionedUsers] = useState<Map<string, User>>(new Map());

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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

    return (
        <Box>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={content}
                    onChange={handleContentChange}
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
    const { addComment } = projectStore;
    const [isReplying, setIsReplying] = useState(false);
    const [repliesOpen, setRepliesOpen] = useState(false);
    
    const handleReplySubmit = async (content: string) => {
        await addComment(content, comment.id);
        setIsReplying(false);
    };

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
                    {comment.content}
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
    const { projectStore } = useStores();
    const { selectedTermComments, addComment } = projectStore;

    const handleCommentSubmit = async (content: string) => {
        await addComment(content, null);
    };

    return (
        <Box>
            <Typography variant="h6" component="h4" sx={{ mb: 2 }}>Comments</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {selectedTermComments.length > 0 ? (
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
                    You can mention other project members using @ to trigger a user list.
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

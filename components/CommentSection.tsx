
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, TextField, Button, Avatar, Paper } from '@mui/material';
import { useStores } from '../stores/StoreProvider';
import { Comment } from '../types';

const CommentForm: React.FC<{
    onSubmit: (content: string) => void;
    onCancel?: () => void;
    submitLabel: string;
    placeholder: string;
}> = ({ onSubmit, onCancel, submitLabel, placeholder }) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onSubmit(content.trim());
            setContent('');
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            <TextField
                fullWidth
                multiline
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                autoFocus={!!onCancel}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                {onCancel && <Button onClick={onCancel}>Cancel</Button>}
                <Button type="submit" variant="contained" disabled={!content.trim()}>{submitLabel}</Button>
            </Box>
        </Box>
    );
};


const CommentView: React.FC<{ comment: Comment }> = observer(({ comment }) => {
    const { projectStore } = useStores();
    const { addComment } = projectStore;
    const [isReplying, setIsReplying] = useState(false);
    
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
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {comment.replies.map(reply => (
                            <CommentView key={reply.id} comment={reply} />
                        ))}
                    </Box>
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
                    You can mention other project members using @their-email.com
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

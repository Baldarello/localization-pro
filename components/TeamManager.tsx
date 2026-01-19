import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { User, UserRole, Invitation } from '../types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box, TextField, Select,
    MenuItem, Avatar, ListItemText, Tooltip, SelectChangeEvent, List, ListItem, Divider, Paper, Chip, FormControl, InputLabel, OutlinedInput, Checkbox, useMediaQuery, Alert, Theme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useStores } from '../stores/StoreProvider';

const TeamManager: React.FC = observer(() => {
    const { uiStore, projectStore, authStore } = useStores();
    const { isTeamManagerOpen, closeTeamManager } = uiStore;
    // FIX: Pass a callback to useMediaQuery to safely access theme properties and avoid potential type errors.
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<UserRole>(UserRole.Translator);
    const [newMemberLanguages, setNewMemberLanguages] = useState<string[]>([]);

    const project = projectStore.selectedProject;
    if (!project) return null;

    const teamMemberIds = Object.keys(project.team);
    const teamMembers = teamMemberIds.map(id => projectStore.allUsers.find(u => u.id === id)).filter((u): u is User => !!u);
    const pendingInvitations = project.pendingInvitations || [];

    // Combine members and invitations into a single list for unified display
    const displayList = [
        ...teamMembers.map(member => ({ type: 'member' as const, key: member.id, data: member })),
        ...pendingInvitations.map(invitation => ({ type: 'invitation' as const, key: `inv-${invitation.id}`, data: invitation }))
    ];

    const currentMemberCount = displayList.length;
    const isMemberLimitReached = authStore.isUsageLimitsEnforced && currentMemberCount >= authStore.memberLimit;

    const handleAdd = () => {
        projectStore.addMember(newMemberEmail, newMemberRole, newMemberLanguages);
        setNewMemberEmail('');
        setNewMemberRole(UserRole.Translator);
        setNewMemberLanguages([]);
    };

    const handleLanguageChange = (event: SelectChangeEvent<string[]>) => {
        const { target: { value } } = event;
        setNewMemberLanguages(typeof value === 'string' ? value.split(',') : value);
    };

    const handleRemoveLanguage = (userId: string, langCodeToRemove: string) => {
        const currentLangs = project.team[userId]?.languages || [];
        const newLangs = currentLangs.filter(code => code !== langCodeToRemove);
        projectStore.updateMemberLanguages(userId, newLangs);
    };

    const handleAddLanguage = (userId: string, langCodeToAdd: string) => {
        if (!langCodeToAdd) return;
        const currentLangs = project.team[userId]?.languages || [];
        if (!currentLangs.includes(langCodeToAdd)) {
            const newLangs = [...currentLangs, langCodeToAdd];
            projectStore.updateMemberLanguages(userId, newLangs);
        }
    };

    return (
        <Dialog open={isTeamManagerOpen} onClose={closeTeamManager} fullWidth maxWidth="md" fullScreen={isMobile}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon />
                    <Typography variant="h6">Manage Team for "{project.name}"</Typography>
                </Box>
                <IconButton onClick={closeTeamManager}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle1" sx={{ px: 2, pt: 2, pb: 1, fontWeight: 'bold' }}>
                    Project Members ({displayList.length})
                </Typography>
                {displayList.length > 0 ? (
                    <List disablePadding>
                        {displayList.map((item, index) => {
                            const isInvitation = item.type === 'invitation';
                            const member = isInvitation ? null : item.data as User;
                            const invitation = isInvitation ? item.data as Invitation : null;

                            const assignedLangs = member ? (project.team[member.id]?.languages || []) : (invitation?.languages || []);
                            const unassignedLangs = member ? project.languages.filter(lang => !assignedLangs.includes(lang.code)) : [];

                            return (
                                <React.Fragment key={item.key}>
                                    <ListItem sx={{ p: 2, bgcolor: 'background.paper', ...(isInvitation && { opacity: 0.75, fontStyle: 'italic' }) }}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mx: -1, width: '100%' }}>
                                            {/* Avatar and Name/Email */}
                                            <Box sx={{ p: 1, width: { xs: '100%', md: '25%' } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ bgcolor: isInvitation ? 'grey.500' : 'secondary.main' }}>
                                                        {isInvitation ? '?' : member?.avatarInitials}
                                                    </Avatar>
                                                    <ListItemText
                                                        primary={isInvitation ? invitation?.email : member?.name}
                                                        secondary={isInvitation ? `Invited as ${invitation?.role}` : member?.email}
                                                        primaryTypographyProps={{ noWrap: true }}
                                                        secondaryTypographyProps={{ noWrap: true }}
                                                        sx={{ minWidth: 0 }}
                                                    />
                                                </Box>
                                            </Box>
                                            {/* Role */}
                                            <Box sx={{ p: 1, width: { xs: '50%', md: '16.67%' } }}>
                                                {isInvitation ? (
                                                    <Chip label={invitation?.role} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                                ) : (
                                                    <Select
                                                        value={project.team[member!.id]?.role || ''}
                                                        onChange={(e) => projectStore.updateMemberRole(member!.id, e.target.value as UserRole)}
                                                        size="small"
                                                        sx={{ width: '100%' }}
                                                    >
                                                        <MenuItem value={UserRole.Translator}>Translator</MenuItem>
                                                        <MenuItem value={UserRole.Editor}>Editor</MenuItem>
                                                        <MenuItem value={UserRole.Admin}>Admin</MenuItem>
                                                    </Select>
                                                )}
                                            </Box>
                                            {/* Languages */}
                                            <Box sx={{ p: 1, width: { xs: '100%', md: '50%' } }}>
                                                <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, minHeight: '40px', bgcolor: isInvitation ? 'action.disabledBackground' : 'transparent' }}>
                                                    {assignedLangs.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>No languages assigned</Typography>}
                                                    {assignedLangs.map(langCode => {
                                                        const lang = project.languages.find(l => l.code === langCode);
                                                        return (
                                                            <Chip
                                                                key={langCode}
                                                                label={lang?.name || langCode}
                                                                onDelete={!isInvitation ? () => handleRemoveLanguage(member!.id, langCode) : undefined}
                                                            />
                                                        );
                                                    })}
                                                    {!isInvitation && unassignedLangs.length > 0 && (
                                                        <FormControl size="small" sx={{ minWidth: 120, ml: 'auto' }}>
                                                            <Select
                                                                value=""
                                                                onChange={(e) => handleAddLanguage(member!.id, e.target.value as string)}
                                                                displayEmpty
                                                                size="small"
                                                                sx={{ '& .MuiSelect-select': { py: 0.5, px: 1 }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                                                            >
                                                                <MenuItem value="" disabled><em>Add Language</em></MenuItem>
                                                                {unassignedLangs.map(lang => (
                                                                    <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    )}
                                                </Paper>
                                            </Box>
                                            {/* Actions */}
                                            <Box sx={{ p: 1, width: { xs: '50%', md: '8.33%' }, textAlign: 'right' }}>
                                                <Tooltip title={isInvitation ? "Revoke invitation" : "Remove member"} children={
                                                    <IconButton
                                                        onClick={() => isInvitation ? projectStore.revokeInvitation(invitation!.id) : projectStore.removeMember(member!.id)}
                                                        aria-label={isInvitation ? "Revoke invitation" : "Remove member"}
                                                    >
                                                        <DeleteIcon color={isInvitation ? "error" : "inherit"} />
                                                    </IconButton>
                                                } />
                                            </Box>
                                        </Box>
                                    </ListItem>
                                    {index < displayList.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                ) : (
                    <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography color="text.secondary">No members yet. Invite someone!</Typography>
                    </Box>
                )}
            </DialogContent>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom>Invite New Member</Typography>
                {isMemberLimitReached && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This project has reached the maximum of {authStore.memberLimit} team members.
                    </Alert>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mx: -1 }}>
                    <Box sx={{ p: 1, width: { xs: '100%', md: '33.3333%' } }}>
                        <TextField
                            label="Email"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            disabled={isMemberLimitReached}
                        />
                    </Box>
                    <Box sx={{ p: 1, width: { xs: '50%', md: '16.6667%' } }}>
                         <Select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                            size="small"
                            fullWidth
                            disabled={isMemberLimitReached}
                         >
                            <MenuItem value={UserRole.Translator}>Translator</MenuItem>
                            <MenuItem value={UserRole.Editor}>Editor</MenuItem>
                            <MenuItem value={UserRole.Admin}>Admin</MenuItem>
                        </Select>
                    </Box>
                     <Box sx={{ p: 1, width: { xs: '50%', md: '25%' } }}>
                        <FormControl size="small" fullWidth disabled={isMemberLimitReached}>
                            <InputLabel>Languages</InputLabel>
                            <Select<string[]>
                                multiple
                                value={newMemberLanguages}
                                onChange={handleLanguageChange}
                                input={<OutlinedInput label="Languages" />}
                                renderValue={(selected) => selected.map(code => project.languages.find(l => l.code === code)?.name || code).join(', ')}
                            >
                                {project.languages.map(lang => (
                                    <MenuItem key={lang.code} value={lang.code}>
                                        <Checkbox checked={newMemberLanguages.includes(lang.code)} />
                                        <ListItemText primary={lang.name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ p: 1, width: { xs: '100%', md: '25%' } }}>
                        <Button fullWidth variant="contained" color="secondary" onClick={handleAdd} startIcon={<AddIcon />} disabled={isMemberLimitReached}>Invite Member</Button>
                    </Box>
                </Box>
            </Box>
            <DialogActions>
                <Button onClick={closeTeamManager}>Done</Button>
            </DialogActions>
        </Dialog>
    );
});

export default TeamManager;
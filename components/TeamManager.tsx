import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { User, Role } from '../types';
import { UIStore } from '../stores/UIStore';
import { ProjectStore } from '../stores/ProjectStore';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box, TextField, Select,
    MenuItem, Avatar, ListItemText, Menu, Checkbox
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';

interface TeamManagerProps {
    uiStore: UIStore;
    projectStore: ProjectStore;
}

const TeamManager: React.FC<TeamManagerProps> = observer(({ uiStore, projectStore }) => {
    const { isTeamManagerOpen, closeTeamManager } = uiStore;

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<Role>('translator');
    const [anchorEl, setAnchorEl] = useState<[string, HTMLElement] | null>(null);

    const project = projectStore.selectedProject;
    if (!project) return null;

    const teamMemberIds = Object.keys(project.team);
    const teamMembers = teamMemberIds.map(id => projectStore.allUsers.find(u => u.id === id)).filter((u): u is User => !!u);

    useEffect(() => {
        if (anchorEl) {
            const memberExists = teamMembers.some(member => member.id === anchorEl[0]);
            if (!memberExists) {
                setAnchorEl(null);
            }
        }
    }, [teamMembers, anchorEl]);

    const handleAdd = () => {
        projectStore.addMember(newMemberEmail, newMemberRole);
        setNewMemberEmail('');
        setNewMemberRole('translator');
    };

    const handleLanguageToggle = (userId: string, langCode: string) => {
        const currentLangs = project.team[userId]?.languages || [];
        const newLangs = currentLangs.includes(langCode)
            ? currentLangs.filter(code => code !== langCode)
            : [...currentLangs, langCode];
        projectStore.updateMemberLanguages(userId, newLangs);
    };

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Member',
            flex: 1,
            minWidth: 250,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>{params.row.avatarInitials}</Avatar>
                    <ListItemText primary={params.row.name} secondary={params.row.email} />
                </Box>
            ),
        },
        {
            field: 'role',
            headerName: 'Role',
            width: 150,
            renderCell: (params) => (
                <Select
                    value={project.team[params.row.id]?.role || ''}
                    onChange={(e) => projectStore.updateMemberRole(params.row.id, e.target.value as Role)}
                    size="small"
                    sx={{ width: '100%' }}
                >
                    <MenuItem value="translator">Translator</MenuItem>
                    <MenuItem value="editor">Editor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                </Select>
            ),
        },
        {
            field: 'languages',
            headerName: 'Languages Assigned',
            width: 200,
            sortable: false,
            renderCell: (params) => {
                const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
                    setAnchorEl([params.row.id, event.currentTarget]);
                };
                const assignedLangs = project.team[params.row.id]?.languages || [];
                return (
                    <>
                        <Button onClick={handleMenuOpen} sx={{ textTransform: 'none' }}>
                            {`${assignedLangs.length} of ${project.languages.length} selected`}
                        </Button>
                        <Menu
                            anchorEl={anchorEl && anchorEl[1]}
                            open={anchorEl ? anchorEl[0] === params.row.id : false}
                            onClose={() => setAnchorEl(null)}
                        >
                            {project.languages.map(lang => (
                                <MenuItem key={lang.code} onClick={() => handleLanguageToggle(params.row.id, lang.code)}>
                                    <Checkbox checked={assignedLangs.includes(lang.code)} />
                                    <ListItemText>{lang.name}</ListItemText>
                                </MenuItem>
                            ))}
                        </Menu>
                    </>
                );
            },
        },
        {
            field: 'actions',
            type: 'actions',
            width: 80,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Remove"
                    onClick={() => projectStore.removeMember(params.row.id)}
                    showInMenu
                />,
            ],
        },
    ];

    return (
        <Dialog open={isTeamManagerOpen} onClose={closeTeamManager} fullWidth maxWidth="lg">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon />
                    <Typography variant="h6">Manage Team for "{project.name}"</Typography>
                </Box>
                <IconButton onClick={closeTeamManager}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Box sx={{ height: 450, width: '100%' }}>
                     <DataGrid
                        rows={teamMembers}
                        columns={columns}
                        rowHeight={70}
                        pageSizeOptions={[5, 10, 20]}
                        disableRowSelectionOnClick
                        autoHeight={false}
                        sx={{
                            border: 'none',
                             '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus': {
                                outline: 'none !important'
                            },
                            '& .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader:focus': {
                                outline: 'none !important'
                            }
                        }}
                        slots={{
                            noRowsOverlay: () => (
                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <Typography color="text.secondary">No members yet. Invite someone!</Typography>
                                </Box>
                            )
                        }}
                    />
                </Box>
            </DialogContent>
            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="h6" gutterBottom>Invite New Member</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Email"
                        variant="outlined"
                        size="small"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        sx={{ flexGrow: 1 }}
                    />
                     <Select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as Role)}
                        size="small"
                        sx={{ minWidth: 150 }}
                        displayEmpty
                     >
                        <MenuItem value="translator">Translator</MenuItem>
                        <MenuItem value="editor">Editor</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                    <Button variant="contained" color="secondary" onClick={handleAdd}>Invite</Button>
                </Box>
            </Box>
            <DialogActions>
                <Button onClick={closeTeamManager}>Done</Button>
            </DialogActions>
        </Dialog>
    );
});

export default TeamManager;
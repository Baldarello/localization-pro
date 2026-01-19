import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip, Box } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import { useStores } from '../stores/StoreProvider';

const BranchSelector: React.FC = observer(() => {
    const { projectStore } = useStores();
    const { selectedProject: project, switchBranch, currentBranch } = projectStore;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    if (!project) return null;

    const handleSwitchBranch = (branchName: string) => {
        switchBranch(branchName);
        setAnchorEl(null);
    };

    return (
        <div>
            <Tooltip title="Switch branch" children={
                <Button
                    id="branch-selector-button"
                    aria-controls={open ? 'branch-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    color="inherit"
                    onClick={(event) => setAnchorEl(event.currentTarget)}
                    startIcon={<AccountTreeIcon />}
                    endIcon={<ExpandMoreIcon />}
                    sx={{
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                        }
                    }}
                >
                    {currentBranch?.isProtected && <LockIcon fontSize="small" sx={{ mr: 0.5 }} />}
                    {project.currentBranchName}
                </Button>
            } />
            <Menu
                id="branch-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                MenuListProps={{ 'aria-labelledby': 'branch-selector-button' }}
                PaperProps={{ style: { minWidth: 220 } }}
            >
                {project.branches.map(branch => (
                    <MenuItem
                        key={branch.name}
                        selected={branch.name === project.currentBranchName}
                        onClick={() => handleSwitchBranch(branch.name)}
                    >
                        {branch.name === project.currentBranchName && (
                            <ListItemIcon>
                                <CheckIcon fontSize="small" />
                            </ListItemIcon>
                        )}
                        <ListItemText inset={branch.name !== project.currentBranchName}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {branch.isProtected && <LockIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                                {branch.name}
                            </Box>
                        </ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
});

export default BranchSelector;
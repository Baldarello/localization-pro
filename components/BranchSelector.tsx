
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useStores } from '../stores/StoreProvider';

const BranchSelector: React.FC = observer(() => {
    const { projectStore } = useStores();
    const { selectedProject: project, switchBranch } = projectStore;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    if (!project) return null;

    const handleSwitchBranch = (branchName: string) => {
        switchBranch(branchName);
        setAnchorEl(null);
    };

    return (
        <div>
            <Tooltip title="Switch branch">
                <Button
                    id="branch-selector-button"
                    aria-controls={open ? 'branch-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    variant="outlined"
                    color="inherit"
                    onClick={(event) => setAnchorEl(event.currentTarget)}
                    startIcon={<AccountTreeIcon />}
                    endIcon={<ExpandMoreIcon />}
                    sx={{
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                        color: 'inherit',
                        textTransform: 'none',
                        '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.87)'
                        }
                    }}
                >
                    {project.currentBranchName}
                </Button>
            </Tooltip>
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
                        <ListItemText inset={branch.name !== project.currentBranchName}>{branch.name}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
});

export default BranchSelector;

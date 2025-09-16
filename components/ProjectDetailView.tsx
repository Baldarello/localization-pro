import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { useStores } from '../stores/StoreProvider';
import { UserRole } from '../types';
import TeamManager from './TeamManager';
import TermList from './TermList';
import TranslationPanel from './TranslationPanel';
import ReviewView from './ReviewView';
import GridEditView from './GridEditView';
import BranchManagerDialog from './BranchManagerDialog';
import ProjectSidebar from './ProjectSidebar';
import HistoryView from './HistoryView';
import TranslateIcon from '@mui/icons-material/Translate';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import HistoryIcon from '@mui/icons-material/History';
import CommitDetailDialog from './CommitDetailDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`view-tabpanel-${index}`}
      aria-labelledby={`view-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProjectDetailView: React.FC = observer(() => {
    const { projectStore } = useStores();
    const [tabValue, setTabValue] = useState(0);

    const { selectedProject: project, currentUserRole } = projectStore;

    if (!project) return null;

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            <ProjectSidebar />
            <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Paper square elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                     <Tabs value={tabValue} onChange={handleTabChange} aria-label="project view tabs" variant="fullWidth">
                        <Tab icon={<TranslateIcon />} iconPosition="start" label="Translate" id="view-tab-0" aria-controls="view-tabpanel-0" sx={{py:2}} title="Focused view for one term at a time." />
                        <Tab icon={<TableChartOutlinedIcon />} iconPosition="start" label="Simple Grid" id="view-tab-1" aria-controls="view-tabpanel-1" sx={{py:2}} title="Quickly edit all translations in a simple grid." />
                        <Tab icon={<GridViewIcon />} iconPosition="start" label="Batch Edit" id="view-tab-2" aria-controls="view-tabpanel-2" sx={{py:2}} title="Advanced spreadsheet view with row-by-row editing." />
                        <Tab icon={<HistoryIcon />} iconPosition="start" label="History" id="view-tab-3" aria-controls="view-tabpanel-3" sx={{py:2}} title="View commit history for this branch." />
                    </Tabs>
                </Paper>
                
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <TabPanel value={tabValue} index={0}>
                         <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                            <TermList />
                            <TranslationPanel />
                        </Box>
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <ReviewView />
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                        <GridEditView />
                    </TabPanel>
                    <TabPanel value={tabValue} index={3}>
                        <HistoryView />
                    </TabPanel>
                </Box>
            </Box>

            {projectStore.selectedProject && currentUserRole === UserRole.Admin && (
                <>
                    <TeamManager />
                    <BranchManagerDialog />
                </>
            )}
        </Box>
    );
});

export default ProjectDetailView;
import React from 'react';

const ProjectSidebar: React.FC = () => {
    // This component is now obsolete. All its functionality has been moved to the main Header
    // and the new StatsView to declutter the UI. It is kept as a null-returning component
    // to avoid breaking imports in a larger project, but its usage has been removed
    // from ProjectDetailView.
    return null;
};

export default ProjectSidebar;

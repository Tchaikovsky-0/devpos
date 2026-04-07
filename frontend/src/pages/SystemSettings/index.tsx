import { useState } from 'react';
import { SettingsSidebar, type SettingsSection } from './layout/SettingsSidebar';
import { SettingsContent } from './layout/SettingsContent';

export const SystemSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('personal');

  return (
    <div className="flex h-full">
      <SettingsSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <SettingsContent activeSection={activeSection} />
    </div>
  );
};

export default SystemSettings;

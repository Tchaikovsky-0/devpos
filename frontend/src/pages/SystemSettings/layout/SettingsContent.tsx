import type { SettingsSection } from './SettingsSidebar';
import { PersonalSettingsSection } from '../sections/PersonalSettings';
import { AlertSettingsSection } from '../sections/AlertSettings';
import { DetectionSettingsSection } from '../sections/DetectionSettings';
import { NotificationSettingsSection } from '../sections/NotificationSettings';
import { SystemInfoSection } from '../sections/SystemInfo';

interface SettingsContentProps {
  activeSection: SettingsSection;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  activeSection,
}) => {
  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalSettingsSection />;
      case 'alerts':
        return <AlertSettingsSection />;
      case 'detection':
        return <DetectionSettingsSection />;
      case 'notifications':
        return <NotificationSettingsSection />;
      case 'system':
        return <SystemInfoSection />;
      default:
        return <PersonalSettingsSection />;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-4xl mx-auto">
        {renderSection()}
      </div>
    </div>
  );
};

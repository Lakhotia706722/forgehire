'use client';

import * as React from 'react';
import { ProfileTabs, type TabId } from './profile-tabs';
import { TabProjects } from './tab-projects';
import { TabExperience } from './tab-experience';
import { TabTechStack } from './tab-tech-stack';
import { TabReviews } from './tab-reviews';
import { TabMarketplace } from './tab-marketplace';
import { TabActivity } from './tab-activity';
import type { EngineerProfile } from '@/lib/mock-data';

interface ProfileContentProps {
  engineer: EngineerProfile;
}

export function ProfileContent({ engineer: eng }: ProfileContentProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>('projects');

  return (
    <>
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tab panels — fade in on switch */}
        <div
          key={activeTab}
          className="animate-fade-up"
          role="region"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'projects'    && <TabProjects    projects={eng.projects} />}
          {activeTab === 'experience'  && <TabExperience  experiences={eng.experiences} />}
          {activeTab === 'tech-stack'  && <TabTechStack   techStack={eng.techStack} />}
          {activeTab === 'reviews'     && <TabReviews     reviews={eng.reviews} />}
          {activeTab === 'marketplace' && <TabMarketplace products={eng.products} />}
          {activeTab === 'activity'    && (
            <TabActivity
              activities={eng.activities}
              engineerInitials={eng.avatarInitials}
              engineerName={eng.name}
            />
          )}
        </div>
      </div>
    </>
  );
}

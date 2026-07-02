import React from 'react';
import { Heading3, Body } from '../design-system/Typography';
import Card from '../design-system/Card';

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-page-in">
      <header>
        <Heading3>Admin Control Panel</Heading3>
        <Body muted className="mt-1">Manage users, system configurations, and platform health.</Body>
      </header>

      <Card>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heading3 className="mb-2">System Overview</Heading3>
          <Body muted>Admin features are currently locked in this environment.</Body>
        </div>
      </Card>
    </div>
  );
}

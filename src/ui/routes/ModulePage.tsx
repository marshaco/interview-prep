import { Link, useParams } from 'react-router-dom';
import { getModule } from '../../content/registry';
import { AppShell } from '../components/shell/AppShell';
import { EmptyState } from '../components/common/EmptyState';
import { ModuleDetails } from '../components/module/ModuleDetails';

export function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const module = moduleId ? getModule(moduleId) : undefined;

  if (!module) {
    return (
      <EmptyState
        title="Module not found"
        description="This roadmap node doesn't exist, or its id changed."
        actionLabel="← Back to roadmap"
        actionHref="/"
      />
    );
  }

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-4 inline-block text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-accent"
      >
        ← Roadmap
      </Link>
      <ModuleDetails moduleId={module.id} />
    </AppShell>
  );
}

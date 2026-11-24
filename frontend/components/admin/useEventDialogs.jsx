'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui';
import { useAdmin } from '@/hooks/admin';
import { createEvent, deleteEvent, updateEvent } from '@/lib/api';
import { EventEditorForm } from './EventEditorForm';
import { DeleteEventDialog } from './AdminPieces';

/** Create/edit and delete dialogs for events. Render `dialogs` once in the page. */
export function useEventDialogs({ onDeleted } = {}) {
  const admin = useAdmin();
  const [editing, setEditing] = useState(null); // {} for new, event for edit
  const [deleting, setDeleting] = useState(null);

  const dialogs = (
    <>
      {editing && (
        <Dialog title={editing.id ? '공연 수정' : '새 공연 만들기'} wide dismissible={false} onClose={() => setEditing(null)}>
          <EventEditorForm
            event={editing}
            onSave={async payload => {
              const ok = await admin.run(
                () => (editing.id ? updateEvent(editing.id, payload) : createEvent(payload)),
                editing.id ? '공연 정보를 저장했어요' : '공연 초안을 만들었어요'
              );
              if (ok) setEditing(null);
            }}
          />
        </Dialog>
      )}
      {deleting && (
        <DeleteEventDialog
          event={deleting}
          onClose={() => setDeleting(null)}
          onDelete={async (id, confirmation) => {
            const ok = await admin.run(() => deleteEvent(id, confirmation), '공연과 연결된 기록을 삭제했어요');
            if (ok) {
              setDeleting(null);
              onDeleted?.();
            }
          }}
        />
      )}
    </>
  );

  return { openEditor: event => setEditing(event || {}), openDelete: setDeleting, dialogs };
}

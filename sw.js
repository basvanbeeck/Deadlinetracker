const CACHE_NAME = 'deadline-tracker-v1';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./index.html'));
});

// Periodieke check van deadlines (vanuit de app getriggerd)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CHECK_DEADLINES') {
    checkAndNotify(e.data.projects);
  }
});

function checkAndNotify(projects) {
  if (!projects) return;
  const now = Date.now();
  const intervals = [
    { ms: 28 * 24 * 60 * 60 * 1000, label: '4 weken' },
    { ms: 14 * 24 * 60 * 60 * 1000, label: '2 weken' },
    { ms:  7 * 24 * 60 * 60 * 1000, label: '1 week' },
    { ms: 24 * 60 * 60 * 1000,      label: '24 uur' },
  ];

  projects.forEach(project => {
    const deadline = new Date(project.deadline).getTime();
    const remaining = deadline - now;
    if (remaining < 0) return;

    intervals.forEach(({ ms, label }) => {
      const key = `notified_${project.id}_${label}`;
      // Check within a 30-minute window around the trigger point
      if (remaining <= ms && remaining > ms - 30 * 60 * 1000) {
        self.registration.showNotification(`Deadline herinnering: ${project.name}`, {
          body: `Nog ${label} tot de deadline!`,
          icon: './icon-192.png',
          badge: './icon-192.png',
          tag: key,
          data: { projectId: project.id }
        });
      }
    });
  });
}

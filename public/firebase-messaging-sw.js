/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAcZckAP087s-Y-3aOodkPuEJNQ9aXD4t8",
  authDomain: "to-do-list-fbdbb.firebaseapp.com",
  projectId: "to-do-list-fbdbb",
  storageBucket: "to-do-list-fbdbb.firebasestorage.app",
  messagingSenderId: "1016376304238",
  appId: "1:1016376304238:web:288e8e47fe41bf75d73c7f",
  measurementId: "G-SC8R22FL6S",
});

var messaging = firebase.messaging();

// ---- IndexedDB helpers for offline local scheduling ----
var DB_NAME = "todo_notifications";
var STORE_NAME = "scheduled";
var DB_VERSION = 1;

function openDB() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function (e) { reject(e.target.error); };
  });
}

function getAllScheduled() {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_NAME, "readonly");
      var store = tx.objectStore(STORE_NAME);
      var req = store.getAll();
      req.onsuccess = function () { resolve(req.result || []); };
      req.onerror = function () { reject(req.error); };
    });
  });
}

function deleteScheduled(id) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_NAME, "readwrite");
      var store = tx.objectStore(STORE_NAME);
      var req = store.delete(id);
      req.onsuccess = function () { resolve(); };
      req.onerror = function () { reject(req.error); };
    });
  });
}

// ---- Local offline notification check (runs every 10s) ----
var LOCAL_CHECK_INTERVAL = 10000;

function checkLocalScheduled() {
  getAllScheduled().then(function (tasks) {
    var now = Date.now();
    tasks.forEach(function (task) {
      if (task.scheduledTime <= now && !task.notified) {
        self.registration.showNotification("Task Reminder", {
          body: "You have a task: " + task.title,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "local-" + task.id,
          requireInteraction: true,
        });
        deleteScheduled(task.id);
      }
    });
  }).catch(function (e) {
    console.warn("[sw] Local schedule check error:", e);
  });
}

setInterval(checkLocalScheduled, LOCAL_CHECK_INTERVAL);
checkLocalScheduled();

// ---- FCM background messages ----
messaging.onBackgroundMessage(function (payload) {
  console.log("[sw] Background FCM:", payload);
  var title = payload.notification?.title || "Task Reminder";
  var body = payload.notification?.body || "You have a task due!";
  return self.registration.showNotification(title, {
    body: body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "fcm-" + (payload.data?.taskId || Date.now()),
    requireInteraction: true,
  });
});

// Fallback raw push handler
self.addEventListener("push", function (event) {
  if (event.data) {
    var data;
    try { data = event.data.json(); } catch (_e) {
      data = { notification: { title: "Task Reminder", body: event.data.text() } };
    }
    var title = data.notification?.title || data.data?.title || "Task Reminder";
    var body = data.notification?.body || data.data?.body || "You have a task due!";
    var tag = "push-" + (data.data?.taskId || Date.now());

    event.waitUntil(
      self.registration.getNotifications({ tag: tag }).then(function (existing) {
        if (existing.length === 0) {
          return self.registration.showNotification(title, {
            body: body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: tag,
            requireInteraction: true,
          });
        }
      })
    );
  }
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if ("focus" in clientList[i]) return clientList[i].focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});

// Listen for messages from the main app to sync scheduled tasks
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SYNC_SCHEDULED_TASKS") {
    var tasks = event.data.tasks || [];
    openDB().then(function (db) {
      var tx = db.transaction(STORE_NAME, "readwrite");
      var store = tx.objectStore(STORE_NAME);
      store.clear();
      tasks.forEach(function (t) {
        store.put(t);
      });
    }).catch(function (e) {
      console.warn("[sw] Failed to sync tasks to IndexedDB:", e);
    });
  }
});

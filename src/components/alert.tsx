import { Fragment, useContext, useEffect, useState } from "react";
import { Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { AlertContext } from "@/features/alert/alertContext";
import { Notification, NotificationType } from "@/features/alert/alert";

export function Alert() {
  const { alert } = useContext(AlertContext);
  const [shownNotification, setShownNotification] =
    useState<Notification | null>(null);
  // this is so we dont get flicker when the notification changes type
  const [shownNotificationType, setShownNotificationType] =
    useState<NotificationType>("error");

  useEffect(() => {
    const interval = setInterval(() => {
      if (alert.notifications.length > 0) {
        setShownNotification(alert.notifications[0]);
        setShownNotificationType(alert.notifications[0].type);

        setTimeout(() => {
          setShownNotification(null);
        }, 8000);

        alert.notifications.shift();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="z-max pointer-events-none fixed flex w-full items-end justify-center sm:items-start sm:justify-end">
      <div className="mx-auto w-80 max-w-80">
        <Transition
          show={shownNotification !== null}
          as={Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <div className="card shadow-subtle pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg rounded-tl-none rounded-tr-none">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {shownNotificationType === "error" ? (
                    <ExclamationCircleIcon
                      className="text-danger h-6 w-6"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircleIcon
                      className="text-success h-6 w-6"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text text-sm font-medium">
                    {shownNotification?.title}
                  </p>
                  <p className="text-muted mt-1 text-sm">
                    {shownNotification?.message}
                  </p>
                </div>
                <div className="ml-4 flex flex-shrink-0">
                  <button
                    type="button"
                    className="text-muted hover:text-text focus-visible:ring-primary focus-visible:ring-offset-surface inline-flex rounded-md bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    onClick={() => {
                      setShownNotification(null);
                    }}>
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
}

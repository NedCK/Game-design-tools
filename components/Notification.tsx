
import React, { useEffect } from 'react';
import { NotificationMessage } from '../types';

interface NotificationProps {
    message: NotificationMessage;
    onDismiss: () => void;
}

const SuccessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const ErrorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


export const Notification: React.FC<NotificationProps> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const baseClasses = "fixed bottom-5 right-5 flex items-center gap-4 p-4 rounded-lg shadow-lg max-w-sm z-50 text-white";
    const typeClasses = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[message.type]}`}>
            {message.type === 'success' && <SuccessIcon className="w-6 h-6" />}
            {message.type === 'error' && <ErrorIcon className="w-6 h-6" />}
            <span>{message.message}</span>
            <button onClick={onDismiss} className="ml-auto text-lg font-bold">&times;</button>
        </div>
    );
};

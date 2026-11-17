import type { UseFormRegisterReturn } from 'react-hook-form';
import { LINK_CHANNEL_OPTIONS, linkChannelLabel } from '../constants/linkChannels';

interface LinkChannelFieldProps {
  id: string;
  registration: UseFormRegisterReturn;
  /** The current value, for the hint under the select ('' when not set). */
  value: string | undefined;
  /** Shown under the select when nothing is chosen. */
  emptyHint: string;
  /** The link was created by an app through the SDK: shown, not editable. */
  userShare?: boolean;
}

const SELECT_CLASS =
  'block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm';

/** "Where will this link go?": the link's channel, used to group results. */
export function LinkChannelField({ id, registration, value, emptyHint, userShare }: LinkChannelFieldProps) {
  const hint = LINK_CHANNEL_OPTIONS.find((o) => o.value === value)?.hint ?? emptyHint;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
        Where will this link go?
      </label>
      {userShare ? (
        <p id={id} className="text-sm text-gray-900 dark:text-white">{linkChannelLabel('user_share')}</p>
      ) : (
        <>
          <select id={id} {...registration} className={SELECT_CLASS}>
            <option value="">Not set</option>
            {LINK_CHANNEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        </>
      )}
    </div>
  );
}

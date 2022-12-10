import { useMemo } from 'preact/hooks';

export type ButtonTypes = 'primary' | 'secondary' | 'text';

export type ButtonProps = {
  children?: Element | string;
  class?: string;
  onClick?: Function;
  type?: ButtonTypes;
};

export function Button({
  children,
  class: classNames,
  onClick,
  type = 'primary',
}: ButtonProps): JSX.Element {
  const typeClass = useMemo(() => {
    switch (type) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg ';
      case 'secondary':
        return 'border text-blue-600 border-blue-600 shadow-md hover:shadow-lg focus:text-blue-700 focus:border-blue-700 hover:text-blue-700 hover:border-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 hover:border-blue-800 active:text-blue-800 active:shadow-lg';
        break;
      case 'text':
        return '';
        break;
    }
  }, [type]);

  return (
    <div class={`flex space-x-2 justify-center ${classNames}`}>
      <button
        onClick={() => onClick && onClick()}
        type="button"
        class={`inline-block px-6 py-2.5 font-medium text-sm leading-tight uppercase rounded transition duration-150 ease-in-out ${typeClass}`}
      >
        {children}
      </button>
    </div>
  );
}

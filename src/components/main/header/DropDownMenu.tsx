import {Fragment, memo, ReactNode} from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface DropdownMenuProps {
    trigger: ReactNode
    items: {
        label: string
        onClick: () => void
        icon?: ReactNode
    }[]
}

function DropDownMenu({ trigger, items }: DropdownMenuProps) {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                {trigger}
                <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
                    <div className="px-1 py-1">
                        {items.map((item, index) => (
                            <Menu.Item key={index}>
                                {({ active }: { active: boolean }) => (
                                    <button
                                        onClick={item.onClick}
                                        className={`${
                                            active ? 'bg-gray-700' : ''
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm text-white`}
                                    >
                                        {item.icon && <span className="mr-2">{item.icon}</span>}
                                        {item.label}
                                    </button>
                                )}
                            </Menu.Item>
                        ))}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    )
}

export default memo(DropDownMenu);
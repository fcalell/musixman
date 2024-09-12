import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { Library } from 'lucide-react'
import { forwardRef } from 'react'
import SettingsDialog from './settings/dialog'

const components: { title: string; href: string; description: string }[] = [
  {
    title: 'Find Duplicates',
    href: '/library/find-duplicates',
    description: 'Identify and list duplicate tracks in your library.',
  },
  {
    title: 'Remove Comments',
    href: '/library/remove-comments',
    description: 'Remove all comments from audio files in your library.',
  },
  {
    title: 'Fix Genres',
    href: '/library/fix-genres',
    description: 'Standardize and correct genre tags in your library.',
  },
  {
    title: 'Find Untagged Files',
    href: '/library/find-untagged',
    description: 'Identify files with missing tags in your library.',
  },
  {
    title: 'Find Low Bitrate Files',
    href: '/library/find-low-bitrate',
    description: 'Locate files with low bitrate in your library.',
  },
]

const MainNav = () => {
  return (
    <div className='flex items-center space-x-4'>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Library</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className='grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]'>
                <li className='row-span-3'>
                  <NavigationMenuLink asChild>
                    <a
                      className='flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md'
                      href='/'
                    >
                      <Library className='h-6 w-6' />
                      <div className='mb-2 mt-4 text-lg font-medium'>Library</div>
                      <p className='text-sm leading-tight text-muted-foreground'>
                        Browse and manage your music collection
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                {/* <ListItem href='/library/albums' title='Albums'> */}
                {/*   Browse your music by album */}
                {/* </ListItem> */}
                {/* <ListItem href='/library/artists' title='Artists'> */}
                {/*   Explore your favorite artists */}
                {/* </ListItem> */}
                {/* <ListItem href='/library/genres' title='Genres'> */}
                {/*   Discover music by genre */}
                {/* </ListItem> */}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className='grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] '>
                {components.map((component) => (
                  <ListItem key={component.title} title={component.title} href={component.href}>
                    {component.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

const ListItem = forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            <div className='text-sm font-medium leading-none'>{title}</div>
            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  }
)
ListItem.displayName = 'ListItem'

export default function Header() {
  return (
    <header className='flex items-center justify-between px-4 py-3 bg-background border-b'>
      <Link to='/' className='text-2xl font-bold text-primary'>
        TrackVault
      </Link>
      <MainNav />
      <SettingsDialog />
    </header>
  )
}

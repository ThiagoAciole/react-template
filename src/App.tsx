import { Flex, Image, TopBar } from '@acyui/components'
import { HomePage } from './pages/HomePage'

export default function App() {
  return (
    <>
      <Flex direction='column' height='100vh' >
        <TopBar logo={<Image src="/icon.svg" alt="Logo" width={32} height={32} />} themeToggle />
        <HomePage />
      </Flex>
    </>
  )
}

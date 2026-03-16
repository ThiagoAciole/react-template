import { Button, Container, Flex, Image, PageHeader } from '@acyui/components'
import logo from '../assets/logo.png'

export function HomePage() {
  return (
    <Container size='full'>
      <Flex direction='column' gap='16' justify='center' align='center' width={500}>
        <PageHeader title='Template' description='Template pronto para uso com o design system @acyui/components.' />
        <Image alt="" src={logo} width={200} />
        <Flex gap='6' width='100%'>
          <Button full>
            Confirmar
          </Button>
          <Button full variant='soft'>
            Cancelar
          </Button>
        </Flex>
      </Flex>
    </Container>
  )
}

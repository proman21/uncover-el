import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  Stack,
} from '@chakra-ui/react'
import Controls, { type ControlOptions } from './Controls'
import OptionsForm from './OptionsForm'
import uncover, { Options } from '../lib'
import { RefObject, useCallback, useRef, useState } from 'react'

interface AppData extends Omit<ControlOptions, 'uncoverOnLoad'> {
  options: Options
}

const App = () => {
  const [{ url, elementId, options }, setData] = useState<AppData>({
    url: '',
    elementId: '',
    options: {},
  })
  const iframeRef = useRef<HTMLIFrameElement>()

  const handleOptionsChange = (options: Options) => {
    setData((d) => ({
      ...d,
      options,
    }))
  }

  const handleControlsChange = (url: string, elementId: string) => {
    setData((d) => ({
      ...d,
      url,
      elementId,
    }))
  }

  const handleUncover = useCallback(() => {
    console.debug('finding element in iframe', iframeRef.current)
    const el =
      iframeRef.current?.contentWindow?.document.getElementById(elementId)

    if (!el) {
      console.debug('No element matching the given ID', elementId)
      return
    }

    console.debug('found element in iframe', el)
    uncover(el as HTMLElement, options)
  }, [elementId, options])

  return (
    <Flex w="100vw" h="100vh" maxH="100vh">
      <Flex flex={1}>
        <Box
          ref={iframeRef as RefObject<HTMLIFrameElement>}
          w="100%"
          as="iframe"
          src={url}
        ></Box>
      </Flex>
      <Divider orientation="vertical" />
      <Stack w="sm" p={5} spacing={5} overflow="auto">
        <Heading as="h1">Uncover</Heading>
        <Card>
          <CardHeader>
            <Heading as="h2" size="md">
              Settings
            </Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <Controls
                onSubmit={handleControlsChange}
                onUncover={handleUncover}
              />
              <Accordion allowMultiple defaultIndex={[0]}>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box as="span" flex="1" textAlign="left">
                        Options
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel>
                    <OptionsForm onChange={handleOptionsChange} />
                  </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box as="span" flex="1" textAlign="left">
                        Debug
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                </AccordionItem>
              </Accordion>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </Flex>
  )
}

export default App

import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Checkbox,
  HStack,
  FormErrorMessage,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { ObjectSchema } from 'yup'
import { useCallback } from 'react'

export interface ControlOptions {
  url: string
  elementId: string
  uncoverOnLoad: boolean
}

const validationSchema: ObjectSchema<ControlOptions> = yup.object({
  url: yup.string().url('Must be a valid URL').required(),
  elementId: yup
    .string()
    .matches(/^\S*$/, 'Must not contain whitespace')
    .required(),
  uncoverOnLoad: yup.boolean().required(),
})

interface Props {
  onSubmit: (url: string, elementId: string) => void
  onUncover: () => void
}

const Controls = ({ onSubmit, onUncover }: Props) => {
  const {
    register,
    formState: { errors, isValid, isSubmitting },
    watch,
    handleSubmit,
  } = useForm<ControlOptions>({
    mode: 'onChange',
    resolver: yupResolver(validationSchema),
    defaultValues: {
      url: 'https://paradiseranchrv.com/booking/',
      elementId: 'newbook_content',
      uncoverOnLoad: true,
    },
  })

  const uncoverOnLoad = watch('uncoverOnLoad', true)
  const handleControlsSubmit = useCallback(
    ({ url, elementId, uncoverOnLoad }: ControlOptions) => {
      onSubmit(url, elementId)
      if (uncoverOnLoad) {
        onUncover()
      }
    },
    [onSubmit, onUncover],
  )

  return (
    <Stack as="form" spacing={3} onSubmit={handleSubmit(handleControlsSubmit)}>
      <FormControl isInvalid={!!errors.url}>
        <FormLabel>URL</FormLabel>
        <Input {...register('url')} type="text" />
        {errors.url?.message && (
          <FormErrorMessage>{errors.url.message}</FormErrorMessage>
        )}
      </FormControl>

      <FormControl isInvalid={!!errors.elementId}>
        <FormLabel>Element ID</FormLabel>
        <Input {...register('elementId')} type="text" />
        {errors.elementId?.message && (
          <FormErrorMessage>{errors.elementId?.message}</FormErrorMessage>
        )}
      </FormControl>

      <FormControl>
        <Checkbox {...register('uncoverOnLoad')}>Uncover on Load</Checkbox>
      </FormControl>

      {uncoverOnLoad ? (
        <Button
          type="submit"
          colorScheme="blue"
          isDisabled={!isValid}
          isLoading={isSubmitting}
        >
          Open and Uncover
        </Button>
      ) : (
        <HStack justifyContent="stretch">
          <Button type="submit" w="100%">
            Open
          </Button>
          <Button w="100%" colorScheme="blue" onClick={onUncover}>
            Uncover
          </Button>
        </HStack>
      )}
    </Stack>
  )
}

export default Controls

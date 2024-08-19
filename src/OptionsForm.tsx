import {
  FormControl,
  FormLabel,
  HStack,
  NumberInput,
  NumberInputField,
  Radio,
  RadioGroup,
  Select,
  Stack,
} from '@chakra-ui/react'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
import type { Options, Position, ScrollBehavior } from '../lib/mod'
import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect } from 'react'

const validationSchema: yup.ObjectSchema<Options> = yup.object({
  retries: yup.number().integer().min(0).default(3),
  interval: yup.number().integer().min(0).default(100),
  x: yup.number().integer().default(0),
  y: yup.number().integer().default(0),
  position: yup.string<Position>().default('top'),
  scrollBehaviour: yup.string<ScrollBehavior>().default('top'),
})

interface Props {
  onChange(options: Options): void
}

const OptionsForm = ({ onChange }: Props) => {
  const { register, control, watch } = useForm<Options>({
    mode: 'onBlur',
    resolver: yupResolver(validationSchema),
    defaultValues: validationSchema.getDefault(),
  })

  useEffect(() => {
    const { unsubscribe } = watch(onChange)
    return unsubscribe
  }, [watch])

  return (
    <Stack as="form" spacing={3}>
      <FormControl>
        <FormLabel>Retries</FormLabel>
        <NumberInput defaultValue={3} min={0}>
          <NumberInputField {...register('retries')} />
        </NumberInput>
      </FormControl>

      <HStack>
        <FormControl>
          <FormLabel>X Offset</FormLabel>
          <NumberInput min={0}>
            <NumberInputField {...register('x')} />
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel>Y Offset</FormLabel>
          <NumberInput min={0}>
            <NumberInputField {...register('y')} />
          </NumberInput>
        </FormControl>
      </HStack>

      <FormControl>
        <FormLabel>Position</FormLabel>
        <Select {...register('position')}>
          <option value="topLeft">Top Left</option>
          <option value="top">Top</option>
          <option value="topRight">Top Right</option>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="bottomLeft">Bottom Left</option>
          <option value="bottom">Bottom</option>
          <option value="bottomRight">Bottom Right</option>
        </Select>
      </FormControl>

      <Controller
        control={control}
        name="scrollBehaviour"
        render={({ field, fieldState: { invalid } }) => (
          <FormControl isInvalid={invalid}>
            <FormLabel>Scroll Behaviour</FormLabel>
            <RadioGroup {...field}>
              <Stack spacing={4} direction="row">
                <Radio value="top">Top</Radio>
                <Radio value="bottom">Bottom</Radio>
                <Radio value="center">Center</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        )}
      />
    </Stack>
  )
}

export default OptionsForm

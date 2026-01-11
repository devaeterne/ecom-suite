"use client"

import { Button, Container, Heading, Text } from "@medusajs/ui"

export default function Home() {
  return (
    <Container className="py-10">
      <Heading level="h1">Ecom Admin</Heading>
      <Text className="mt-2">
        Medusa UI aktif. Sıradaki adım: login + dashboard layout.
      </Text>

      <div className="mt-6 flex gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
      </div>
    </Container>
  )
}

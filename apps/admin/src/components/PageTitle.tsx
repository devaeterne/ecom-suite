'use client'

import { Col, Row, Badge } from 'react-bootstrap'
import Link from 'next/link'
import IconifyIcon from './wrapper/IconifyIcon'
import { useTenant } from '@/lib/tenant-context'

const PageTitle = ({ title, subName }: { title: string; subName: string }) => {
  const { tenant, isLoading, error } = useTenant()

  const label = error
    ? 'Tenant error'
    : isLoading
      ? 'Loading…'
      : tenant?.name ?? '—'
  console.log('tenant', tenant)

  return (
    <Row>
      <Col xs={12}>
        <div className="page-title-box">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <h4 className="mb-0 fw-semibold">{title}</h4>

            <Badge bg={error ? 'danger' : 'secondary'} className="fw-normal">
              {label}
            </Badge>
          </div>

          <ol className="breadcrumb mb-0 align-items-center">
            <li className="breadcrumb-item">
              <Link href="#">{subName}</Link>
            </li>

            <IconifyIcon width={22} height={21} icon="ri:arrow-drop-right-line" />

            <li className="breadcrumb-item active">
              {title}
            </li>
          </ol>
        </div>
      </Col>
    </Row>
  )
}

export default PageTitle

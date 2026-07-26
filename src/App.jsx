import { useEffect, useRef, useState } from 'react'
import './App.css'

const backgroundImage = '/invitation/background.png'
const graduateImage = '/invitation/graduate.png'
const foregroundImage = '/invitation/foreground-fade.png'
const rsvpEndpoint =
  import.meta.env.VITE_RSVP_ENDPOINT?.trim() ||
  'https://script.google.com/macros/s/AKfycbz4OVlI2lbxVFwTqNkt1P-FXny-luEucoFN5WBoltmQoPV5gnc3CU8qyX59lw5rDiVg/exec'

const initialForm = {
  fullName: '',
  ceremony: '',
  vluAffiliation: '',
  birthYear: '',
  phone: '',
  email: '',
  party: [],
  note: '',
}

const isGmailAddress = (email) => /^[A-Z0-9._%+-]+@gmail\.com$/i.test(email)
const isVietnamesePhoneNumber = (phone) =>
  /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/.test(phone.replace(/[.\s()-]/g, ''))

const invitationGuideSteps = [
  {
    target: 'date',
    title: 'Ngày diễn ra lễ',
    description: 'Lễ tốt nghiệp diễn ra vào Thứ năm 06/08.',
  },
  {
    target: 'time',
    title: 'Giờ bắt đầu',
    description: 'Buổi lễ bắt đầu vào lúc 10H30.',
  },
  {
    target: 'address',
    title: 'Địa điểm',
    description: 'Nhấn vào địa chỉ để mở chỉ đường trên Google Maps.',
  },
  {
    target: 'phone',
    title: 'Số điện thoại',
    description: 'Nhấn vào một trong hai số để gọi nhanh.',
  },
  {
    target: 'confirm',
    title: 'Xác nhận tham dự',
    description: 'Nhấn nút này để mở biểu mẫu xác nhận của bạn.',
  },
]

const getSuccessMessage = ({ ceremony, party }) => {
  const isAttendingParty = party.length > 0 && !party.includes('Không')

  if (ceremony === 'Có' && isAttendingParty) {
    return 'Cảm ơn bạn đã xác nhận.\nThông tin buổi tiệc mình sẽ thông báo cho bạn sau.\nHẹn gặp bạn tại lễ tốt nghiệp của mình nhé! ^^'
  }

  if (ceremony === 'Có') {
    return 'Cảm ơn bạn đã xác nhận.\nHẹn gặp bạn tại lễ tốt nghiệp của mình nhé! ^^'
  }

  if (isAttendingParty) {
    return 'Cảm ơn bạn đã xác nhận.\nHẹn gặp bạn tại buổi tiệc ^^ thông tin mình sẽ thông báo cho bạn sau nhé!'
  }

  return 'Thật tiếc khi bạn không đến được lễ tốt nghiệp và buổi tiệc của mình :(\nHẹn gặp lại vào dịp khác nhé!'
}

function App() {
  const [isRsvpOpen, setIsRsvpOpen] = useState(false)
  const [formData, setFormData] = useState(initialForm)
  const [submitState, setSubmitState] = useState('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [guideStep, setGuideStep] = useState(null)
  const triggerRef = useRef(null)
  const guideTargetRefs = useRef({})

  useEffect(() => {
    if (!isRsvpOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsRsvpOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isRsvpOpen])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tourTimer = window.setTimeout(
      () => setGuideStep(0),
      prefersReducedMotion ? 0 : 3500,
    )

    return () => window.clearTimeout(tourTimer)
  }, [])

  const openRsvp = () => {
    setSubmitState('idle')
    setSubmitMessage('')
    setIsRsvpOpen(true)
  }

  const closeRsvp = () => {
    setIsRsvpOpen(false)
    triggerRef.current?.focus()
  }

  const updateField = (event) => {
    const { name, value } = event.target

    if (name === 'email') {
      event.target.setCustomValidity(
        value && !isGmailAddress(value.trim())
          ? 'Vui lòng nhập địa chỉ email có đuôi @gmail.com.'
          : '',
      )
    }

    if (name === 'phone') {
      event.target.setCustomValidity(
        value && !isVietnamesePhoneNumber(value)
          ? 'Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0901234567).'
          : '',
      )
    }

    setFormData((current) => ({ ...current, [name]: value }))
  }

  const updateCeremonyAttendance = (event) => {
    const { value } = event.target

    setFormData((current) => ({
      ...current,
      ceremony: value,
      ...(value === 'Có' ? {} : { vluAffiliation: '', birthYear: '', phone: '', email: '' }),
    }))
  }

  const updateVluAffiliation = (event) => {
    const { value } = event.target

    setFormData((current) => ({
      ...current,
      vluAffiliation: value,
      ...(value === 'Không phải' ? {} : { birthYear: '', phone: '', email: '' }),
    }))
  }

  const updatePartySelection = (event) => {
    const { value, checked } = event.target

    setFormData((current) => {
      if (value === 'Không') {
        return { ...current, party: checked ? ['Không'] : [] }
      }

      const selectedDays = current.party.filter((option) => option !== 'Không')

      return {
        ...current,
        party: checked
          ? [...selectedDays, value]
          : selectedDays.filter((option) => option !== value),
      }
    })
  }

  const submitRsvp = async (event) => {
    event.preventDefault()

    if (formData.vluAffiliation === 'Không phải' && !formData.birthYear) {
      setSubmitState('error')
      setSubmitMessage('Vui lòng chọn năm sinh của bạn.')
      return
    }

    if (formData.vluAffiliation === 'Không phải' && !formData.phone.trim()) {
      setSubmitState('error')
      setSubmitMessage('Vui lòng nhập số điện thoại để mình liên hệ khi cần.')
      return
    }

    if (
      formData.vluAffiliation === 'Không phải' &&
      !isVietnamesePhoneNumber(formData.phone)
    ) {
      setSubmitState('error')
      setSubmitMessage('Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0901234567).')
      return
    }

    if (formData.vluAffiliation === 'Không phải' && !formData.email.trim()) {
      setSubmitState('error')
      setSubmitMessage('Vui lòng nhập email để mình gửi thông tin tham dự trường.')
      return
    }

    if (
      formData.vluAffiliation === 'Không phải' &&
      !isGmailAddress(formData.email.trim())
    ) {
      setSubmitState('error')
      setSubmitMessage('Vui lòng nhập địa chỉ email có đuôi @gmail.com.')
      return
    }

    if (formData.party.length === 0) {
      setSubmitState('error')
      setSubmitMessage('Vui lòng chọn ít nhất một ngày hoặc xác nhận không tham dự tiệc.')
      return
    }

    if (!rsvpEndpoint) {
      setSubmitState('error')
      setSubmitMessage(
        'Biểu mẫu chưa được kết nối nơi nhận phản hồi. Vui lòng thử lại sau.',
      )
      return
    }

    setSubmitState('submitting')
    setSubmitMessage('')

    try {
      await fetch(rsvpEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          party: formData.party.join(', '),
          submittedAt: new Date().toISOString(),
        }),
      })

      setSubmitState('success')
      setSubmitMessage(getSuccessMessage(formData))
      setFormData(initialForm)
    } catch {
      setSubmitState('error')
      setSubmitMessage(
        'Chưa thể gửi xác nhận. Vui lòng kiểm tra kết nối và thử lại.',
      )
    }
  }

  const isAttendingCeremony = formData.ceremony === 'Có'
  const activeGuideTarget =
    guideStep === null ? null : invitationGuideSteps[guideStep].target
  const activeGuide = guideStep === null ? null : invitationGuideSteps[guideStep]

  return (
    <main className="invitation-page">
      <section
        className={`invitation-stage${activeGuide ? ' is-guide-active' : ''}`}
        aria-labelledby="invitation-title"
      >
        <div
          className="background-layer"
          style={{ backgroundImage: `url("${backgroundImage}")` }}
          aria-hidden="true"
        />

        <div className="graduate-reveal" aria-hidden="true">
          <img className="graduate-photo" src={graduateImage} alt="" />
        </div>

        <img
          className="foreground-layer"
          src={foregroundImage}
          alt=""
          aria-hidden="true"
        />

        <header className="graduation-heading">
          <span className="happy-text">Happy</span>
          <h1 id="invitation-title">Graduation</h1>
        </header>

        <p className="graduate-name graduate-name-left" aria-label="Bắp">
          <span aria-hidden="true">B</span>
          <span className="accented-a" aria-hidden="true">
            A
          </span>
          <span aria-hidden="true">P</span>
        </p>
        <p className="graduate-name graduate-name-right" aria-label="Bắp">
          <span aria-hidden="true">B</span>
          <span className="accented-a" aria-hidden="true">
            A
          </span>
          <span aria-hidden="true">P</span>
        </p>

        <div className="event-details">
          <div className="event-time-row">
            <div
              ref={(element) => {
                guideTargetRefs.current.date = element
              }}
              className={`event-time${activeGuideTarget === 'date' ? ' is-guide-highlighted' : ''}`}
            >
              <span>Thứ năm</span>
              <strong>06/08</strong>
            </div>
            <div
              ref={(element) => {
                guideTargetRefs.current.time = element
              }}
              className={`event-time${activeGuideTarget === 'time' ? ' is-guide-highlighted' : ''}`}
            >
              <span>Vào lúc</span>
              <strong>10H30</strong>
            </div>
          </div>

          <div className="event-divider" aria-hidden="true" />

          <div className="university">
            <img
              className="university-logo"
              src="/invitation/logo-vlu-white.png"
              alt="Logo Văn Lang University"
            />
            <span>Van Lang University</span>
          </div>

          <a
            ref={(element) => {
              guideTargetRefs.current.address = element
            }}
            className={`event-address${activeGuideTarget === 'address' ? ' is-guide-highlighted' : ''}`}
            href="https://www.google.com/maps/search/?api=1&query=69%2F68%20%C4%90%E1%BA%B7ng%20Th%C3%B9y%20Tr%C3%A2m%2C%20ph%C6%B0%E1%BB%9Dng%20B%C3%ACnh%20L%E1%BB%A3i%20Trung%2C%20TP.%20HCM"
            target="_blank"
            rel="noreferrer"
          >
            69/68 Đặng Thùy Trâm, phường Bình Lợi Trung, TP. HCM
          </a>

          <div
            ref={(element) => {
              guideTargetRefs.current.phone = element
            }}
            className={`contact-row${activeGuideTarget === 'phone' ? ' is-guide-highlighted' : ''}`}
          >
            <a href="tel:+84335434504">
              <span className="phone-icon" aria-hidden="true">
                <i className="fa-solid fa-phone" />
              </span>
              033 543 4504
            </a>
            <a href="tel:+84385407533">
              <span className="phone-icon" aria-hidden="true">
                <i className="fa-solid fa-phone" />
              </span>
              038 540 7533
            </a>
          </div>
        </div>

        <button
          ref={triggerRef}
          className={`rsvp-trigger${activeGuideTarget === 'confirm' ? ' is-guide-highlighted' : ''}`}
          type="button"
          onClick={openRsvp}
          aria-haspopup="dialog"
        >
          <span className="rsvp-trigger-seal" aria-hidden="true">
            ✓
          </span>
          Xác nhận tham dự
        </button>

        {activeGuide && (
          <>
            <aside className="invitation-guide" aria-live="polite">
              <p className="invitation-guide-count">
                {guideStep + 1} / {invitationGuideSteps.length}
              </p>
              <h2>{activeGuide.title}</h2>
              <p>{activeGuide.description}</p>
              <div className="invitation-guide-actions">
                {guideStep > 0 && (
                  <button type="button" onClick={() => setGuideStep(guideStep - 1)}>
                    Quay lại
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setGuideStep(
                      guideStep === invitationGuideSteps.length - 1 ? null : guideStep + 1,
                    )
                  }
                >
                  {guideStep === invitationGuideSteps.length - 1 ? 'Hoàn tất' : 'Tiếp theo'}
                </button>
              </div>
            </aside>
          </>
        )}
      </section>

      {isRsvpOpen && (
        <div className="rsvp-backdrop" onMouseDown={closeRsvp}>
          <section
            className="rsvp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rsvp-title"
            aria-describedby="rsvp-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="rsvp-heading">
              <div>
                <p className="rsvp-eyebrow">Lễ tốt nghiệp</p>
                <h2 id="rsvp-title">Bạn sẽ đến chung vui chứ?</h2>
                <p id="rsvp-description">
                  Một lời xác nhận của bạn sẽ giúp mình chuẩn bị chu đáo hơn!
                </p>
              </div>
              <button
                className="rsvp-close"
                type="button"
                onClick={closeRsvp}
                aria-label="Đóng biểu mẫu"
              >
                ×
              </button>
            </div>

            {submitState === 'success' ? (
              <div className="rsvp-success" role="status">
                <span aria-hidden="true">✓</span>
                <h3>Đã nhận phản hồi</h3>
                <p>{submitMessage}</p>
                <button type="button" onClick={closeRsvp}>
                  Hoàn tất
                </button>
              </div>
            ) : (
              <form className="rsvp-form" onSubmit={submitRsvp}>
                <label className="rsvp-field">
                  <span>
                    Họ và tên <strong aria-hidden="true">*</strong>
                  </span>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={updateField}
                    autoComplete="name"
                    placeholder="Nhập họ và tên của bạn"
                    required
                    autoFocus
                  />
                </label>

                <div className="rsvp-ceremony-section">
                <fieldset className="rsvp-fieldset">
                  <legend>
                    Bạn tham dự lễ tốt nghiệp của mình chứ?{' '}
                    <strong aria-hidden="true">*</strong>
                  </legend>
                  <div className="rsvp-options">
                    <label>
                      <input
                        type="radio"
                        name="ceremony"
                        value="Có"
                        checked={formData.ceremony === 'Có'}
                        onChange={updateCeremonyAttendance}
                        required
                      />
                      <span>Có, mình sẽ đến</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="ceremony"
                        value="Không"
                        checked={formData.ceremony === 'Không'}
                        onChange={updateCeremonyAttendance}
                        required
                      />
                      <span>Mình không thể đến</span>
                    </label>
                  </div>
                </fieldset>

                <div
                  className={`rsvp-vlu-reveal${
                    isAttendingCeremony ? ' is-visible' : ''
                  }`}
                  aria-hidden={!isAttendingCeremony}
                >
                  <div className="rsvp-vlu-reveal-inner">
                <fieldset className="rsvp-fieldset">
                  <legend>
                    Bạn có phải là sinh viên/cựu sinh viên VLU không?{' '}
                    <strong aria-hidden="true">*</strong>
                  </legend>
                  <div className="rsvp-options">
                    <label>
                      <input
                        type="radio"
                        name="vluAffiliation"
                        value="Đúng rồi"
                        checked={formData.vluAffiliation === 'Đúng rồi'}
                        onChange={updateVluAffiliation}
                        required={isAttendingCeremony}
                        disabled={!isAttendingCeremony}
                      />
                      <span>Đúng rồi</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="vluAffiliation"
                        value="Không phải"
                        checked={formData.vluAffiliation === 'Không phải'}
                        onChange={updateVluAffiliation}
                        required={isAttendingCeremony}
                        disabled={!isAttendingCeremony}
                      />
                      <span>Không phải</span>
                    </label>
                  </div>

                  {formData.vluAffiliation === 'Đúng rồi' && (
                    <p className="rsvp-vlu-reminder" role="status">
                      Nhớ đem theo thẻ sinh viên để được vào trường nhé!
                    </p>
                  )}

                  <div
                    className={`rsvp-email-reveal${
                      isAttendingCeremony && formData.vluAffiliation === 'Không phải'
                        ? ' is-visible'
                        : ''
                    }`}
                    aria-hidden={
                      !isAttendingCeremony || formData.vluAffiliation !== 'Không phải'
                    }
                    >
                    <div className="rsvp-email-reveal-inner">
                      <label className="rsvp-field">
                        <span>
                          Năm sinh <strong aria-hidden="true">*</strong>
                        </span>
                        <input
                          type="number"
                          name="birthYear"
                          value={formData.birthYear}
                          onChange={updateField}
                          autoComplete="bday-year"
                          inputMode="numeric"
                          min="1900"
                          max={new Date().getFullYear()}
                          placeholder="Nhập năm sinh của bạn"
                          required={
                            isAttendingCeremony && formData.vluAffiliation === 'Không phải'
                          }
                          disabled={
                            !isAttendingCeremony || formData.vluAffiliation !== 'Không phải'
                          }
                        />
                      </label>
                      <label className="rsvp-field">
                        <span>
                          Số điện thoại <strong aria-hidden="true">*</strong>
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={updateField}
                          autoComplete="tel"
                          inputMode="tel"
                          pattern="(?:0|[+]84)[ .()-]*(?:3|5|7|8|9)(?:[ .()-]*[0-9]){8}"
                          title="Vui lòng nhập số điện thoại Việt Nam hợp lệ, ví dụ: 0901234567"
                          placeholder="Nhập số điện thoại của bạn"
                          required={
                            isAttendingCeremony && formData.vluAffiliation === 'Không phải'
                          }
                          disabled={
                            !isAttendingCeremony || formData.vluAffiliation !== 'Không phải'
                          }
                        />
                      </label>
                      <label className="rsvp-field">
                        <span>
                          Email <strong aria-hidden="true">*</strong>
                          <small className="rsvp-email-note">
                            Mình xin email để đăng ký với trường cho bạn vào cổng nhá!
                          </small>
                        </span>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={updateField}
                          autoComplete="email"
                          inputMode="email"
                          pattern="^[A-Za-z0-9._%+-]+@gmail[.]com$"
                          title="Vui lòng nhập địa chỉ email có đuôi @gmail.com"
                          placeholder="Nhập email của bạn"
                          required={
                            isAttendingCeremony && formData.vluAffiliation === 'Không phải'
                          }
                          disabled={
                            !isAttendingCeremony || formData.vluAffiliation !== 'Không phải'
                          }
                        />
                      </label>
                    </div>
                  </div>
                </fieldset>
                  </div>
                </div>
                </div>

                <fieldset className="rsvp-fieldset">
                  <legend>
                    Mình dự kiến tổ chức tiệc nhưng chưa chốt ngày, bạn rảnh ngày nào?{' '}
                    <strong aria-hidden="true">*</strong>
                  </legend>
                  <p className="rsvp-options-hint">Bạn có thể chọn nhiều ngày phù hợp!</p>
                  <div className="rsvp-options">
                    <label>
                      <input
                        type="checkbox"
                        name="party"
                        value="Tối thứ 5 (06/08)"
                        checked={formData.party.includes('Tối thứ 5 (06/08)')}
                        onChange={updatePartySelection}
                      />
                      <span>Tối thứ 5 (06/08)</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="party"
                        value="Tối thứ 6 (07/08)"
                        checked={formData.party.includes('Tối thứ 6 (07/08)')}
                        onChange={updatePartySelection}
                      />
                      <span>Tối thứ 6 (07/08)</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="party"
                        value="Tối thứ 7 (08/08)"
                        checked={formData.party.includes('Tối thứ 7 (08/08)')}
                        onChange={updatePartySelection}
                      />
                      <span>Tối thứ 7 (08/08)</span>
                    </label>
                    <label className="rsvp-option-no-party">
                      <input
                        type="checkbox"
                        name="party"
                        value="Không"
                        checked={formData.party.includes('Không')}
                        onChange={updatePartySelection}
                      />
                      <span>Mình không tham dự</span>
                    </label>
                  </div>
                </fieldset>

                <label className="rsvp-field">
                  <span>
                    Lời nhắn nhủ
                  </span>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={updateField}
                    rows="3"
                    placeholder="Lời nhắn dành cho Bắp..."
                  />
                </label>

                {submitState === 'error' && (
                  <p className="rsvp-error" role="alert">
                    {submitMessage}
                  </p>
                )}

                <button
                  className="rsvp-submit"
                  type="submit"
                  disabled={submitState === 'submitting'}
                >
                  {submitState === 'submitting'
                    ? 'Đang gửi xác nhận...'
                    : 'Gửi xác nhận'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default App

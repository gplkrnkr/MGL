/**
 * One number, one role: thrown when someone signs in on the wrong side of the site (an employer's
 * number on the worker sign-in, or a worker's on the employer sign-in). The message is shown as is.
 */
export class WrongRoleError extends Error {
  readonly registeredAs: 'worker' | 'employer'

  constructor(registeredAs: 'worker' | 'employer') {
    super(
      registeredAs === 'employer'
        ? 'This number is registered as an employer. Use the employer sign-in, or a different number to find work.'
        : 'This number is registered as a worker. Use the worker sign-in, or a different number to hire workers.',
    )
    this.name = 'WrongRoleError'
    this.registeredAs = registeredAs
  }
}

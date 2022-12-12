import 'ses';

try {
  lockdown();
} catch (error) {
  console.log('Error occurred while locking environment', error);
}

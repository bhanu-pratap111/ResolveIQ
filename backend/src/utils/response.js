function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function paginated(res, data, pagination, message = 'Success') {
  return res.status(200).json({ success: true, message, data, pagination });
}

function error(res, message = 'An error occurred.', statusCode = 400, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { success, paginated, error };

document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);
  document.querySelector("#compose-form").onsubmit = send_email;
  // By default, load the inbox
  load_mailbox("inbox");
});

// compose email
function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#sent-view").style.display = "none";
  document.querySelector("#view-email").style.display = "none";
  document.querySelector("#result-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").innerHTML = "";
}

// send email
function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const keygen = document.querySelector('#compose-keygen').value
  const body = document.querySelector("#compose-body").innerHTML;

  // send the email
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if ("message" in result) {
        load_mailbox("sent");
        document.querySelector("#result-view").style.display = "block";
        document.querySelector("#result-view").innerHTML = `
        <div class="alert rounded-0 alert-success alert-dismissible fade show" role="alert">
        <strong>Success! </strong> ${result.message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        `;
      } else if ("error" in result) {
        document.querySelector("#result-view").style.display = "block";
        document.querySelector("#result-view").innerHTML = `
        <div class="alert rounded-0 alert-danger alert-dismissible fade show" role="alert">
          <strong>Error! </strong> ${result.error}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        `;
      }
    });
}

// reply email
function reply_email(email_id) {
  // show the compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#view-email").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  // pre-fill the composition
  document.querySelector("#compose-recipients").value = email_id.sender;
  document.querySelector("#compose-subject").value = `Re: ${email_id.subject}`;
  const original_email = document.createElement("p");
  original_email.setAttribute("id", "original-email");
  original_email.innerHTML = `
          <br><br>
            <hr>
            <span style="color:#cf6a87">
              <small>
                <strong>On ${email_id.timestamp} ${email_id.sender} wrote:</strong>
                <br><br>
                ${email_id.body}
              </small>
            </span>
          `;
  document.querySelector("#compose-body").appendChild(original_email);
}

// view inbox/archive email
function view_email(email_id) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#sent-view").style.display = "none";
  document.querySelector("#result-view").style.display = "none";
  document.querySelector("#view-email").style.display = "block";
  fetch(`/emails/${email_id}`)
    .then((response) => response.json())
    .then((email) => {
      document.querySelector("#view-email").innerHTML = `
      <div class="row justify-content-between mb-3">
        <div class="col-7 col-md-8 col-lg-9">
          <h5><i class="fa-solid fa-bookmark"></i>&nbsp;&nbsp;${email.subject}</h5>
        </div>

        <div class="col-5 col-md-4 col-lg-3 text-end" id="archive-button">
          <a class="link-primary" id="reply"><i class="fa-solid fa-reply"></i>&nbsp;&nbsp;Reply</a>&nbsp;&nbsp;
        </div>
      </div>

      <div class="row justify-content-between">
        <div class="col-auto"><small><i class="fas fa-user-circle"></i>&nbsp;&nbsp;From: ${email.sender}</small></div>
        <div class="col-auto"><small><i class="fas fa-user-circle"></i>&nbsp;&nbsp;To: ${email.recipients}</small></div>
        <div class="col-auto"><small><i class="fas fa-clock"></i>&nbsp;&nbsp;${email.timestamp}</small></div>
      </div>
        
      <div class="card rounded-0 mt-4">
        <div class="card-body"><small>${email.body}</small></div>
      </div>
      `;

      if (!email.archived) {
        // if email is not archived show the archive button
        document.querySelector(
          "#archive-button"
        ).innerHTML += `<a class="link-primary" id="archive"><i class="fa-solid fa-box-archive"></i>&nbsp;&nbsp;Archive</a>`;

        // archive button
        document.querySelector("#archive").addEventListener("click", () => {
          // archive the email
          fetch(`/emails/${email_id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: true,
            }),
          });
          load_mailbox("archive");
        });
      } else {
        // if email is archived show the unarchive button
        document.querySelector(
          "#archive-button"
        ).innerHTML += `<a class="link-primary" id="unarchive"><i class="fa-solid fa-box-archive"></i>&nbsp;&nbsp;Unarchive</a>`;

        // unarchive button
        document.querySelector("#unarchive").addEventListener("click", () => {
          // unarchive the email
          fetch(`/emails/${email_id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: false,
            }),
          });
          load_mailbox("inbox");
        });
      }

      // mark the email as read
      fetch(`/emails/${email_id}`, {
        method: "PUT",
        body: JSON.stringify({
          read: true,
        }),
      });
    });
}

// view sent email
function view_email_sent(email_id) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#view-email").style.display = "none";
  document.querySelector("#result-view").style.display = "none";
  document.querySelector("#sent-view").style.display = "block";
  fetch(`/emails/${email_id}`)
    .then((response) => response.json())
    .then((email) => {
      document.querySelector("#sent-view").innerHTML = `
      <div class="row justify-content-between mb-3">
        <div class="col-7 col-md-8 col-lg-9">
          <h5><i class="fa-solid fa-bookmark"></i>&nbsp;&nbsp;${email.subject}</h5>
        </div>
      </div>
      
      <div class="row justify-content-between">
        <div class="col-auto"><small><i class="fas fa-user-circle"></i>&nbsp;&nbsp;From: ${email.sender}</small></div>
        <div class="col-auto"><small><i class="fas fa-user-circle"></i>&nbsp;&nbsp;To: ${email.recipients}</small></div>
        <div class="col-auto"><small><i class="fas fa-clock"></i>&nbsp;&nbsp;${email.timestamp}</small></div>
      </div>
      
      <div class="card rounded-0 mt-4">
        <div class="card-body"><small>${email.body}</small></div>
      </div>
      `;
    });
}
// load mailbox
function load_mailbox(mailbox) {
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#result-view").style.display = "none";
  document.querySelector("#view-email").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#sent-view").style.display = "none";

  // show the mailbox name
  document.querySelector(
    "#emails-view"
  ).innerHTML = `<h3 class="mb-4 fw-bold">${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  // show the emails
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      if (emails.length === 0) {
        document.querySelector("#emails-view").innerHTML += `
        <div class="row h-100 mt-5">
          <div class="col-md-12 my-auto" style="color:grey">
            <h5 class="text-comment text-center">
              <i class="fa-solid fa-inbox"></i><br>Your ${mailbox} is empty</h5>
            </h5>
          </div>
        </div>
        `;
      } else {
        emails.forEach((email) => {
          const element = document.createElement("div");
          element.className = "card mb-2 rounded-0";
          element.innerHTML = `
          <div class="card-body">

            <div class="row align-items-center">

              <div class="col-4 col-md-3">
                  <div class="row">
                    <div class="col-2 text-end "><i class="fas fa-user-circle"></i></div>
                    <div class="col-10 text-start" style="overflow: hidden; display: -webkit-box;-webkit-line-clamp: 1;-webkit-box-orient: vertical;">${email.sender}</div>
                  </div>
              </div>

              <div class="col-4 col-md-6">
                <div class="row">
                  <div class="col-2 text-end read-unread"></div>
                  <div class="col-10" style="overflow: hidden; display: -webkit-box;-webkit-line-clamp: 1;-webkit-box-orient: vertical;">${email.subject}</div>
                </div>
              </div>

              <div class="col-4 col-md-3">
                <div class="row">
                  <div class="col-2 col-xl-2 col-xxl-4 text-end"><i class="fas fa-clock"></i></div>
                  <div class="col-10 col-xl-10 col-xxl-8 text-start" style="overflow: hidden; display: -webkit-box;-webkit-line-clamp: 1;-webkit-box-orient: vertical;">${email.timestamp}</div>
                </div>
              </div>

            </div>
          </div>`;
          document.querySelector("#emails-view").append(element);

          // Time format
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const email_date = new Date(email.timestamp);
          const time = email_date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
          if (email_date.toDateString() === today.toDateString()) {
            element.querySelector(
              ".col-10.col-xl-10.col-xxl-8.text-start"
            ).innerHTML = `Today at ${time}`;
          } else if (email_date.toDateString() === yesterday.toDateString()) {
            element.querySelector(
              ".col-10.col-xl-10.col-xxl-8.text-start"
            ).innerHTML = `Yesterday at ${time}`;
          } else if (today - email_date > 2592000000) {
            element.querySelector(
              ".col-10.col-xl-10.col-xxl-8.text-start"
            ).innerHTML = `${email_date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })} at ${time}`;
          } else {
            element.querySelector(
              ".col-10.col-xl-10.col-xxl-8.text-start"
            ).innerHTML = `${Math.round(
              (today - email_date) / 86400000
            )} days ago at ${time}`;
          }
          element.style.cursor = "pointer";
          element.style.fontWeight = "normal";
          if (mailbox === "inbox" || mailbox === "archive") {
            element.addEventListener("click", () => view_email(email.id));
          } else if (mailbox === "sent") {
            element.addEventListener("click", () => view_email_sent(email.id));
          }
          if (email.read) {
            element.style.backgroundColor = "rgb(248,249,248)";
            element.style.color = "grey";
            element.querySelector(
              ".read-unread"
            ).innerHTML = `<i class="fa-solid fa-envelope-open-text"></i>`;
          } else {
            element.style.backgroundColor = "white";
            element.style.color = "black";
            element.querySelector(
              ".read-unread"
            ).innerHTML = `<i class="fa-solid fa-envelope"></i>`;
          }
          // background color
          element.addEventListener("mouseover", () => {
            element.style.backgroundColor = "#0d6efd";
            element.style.color = "#fff";
            element.style.fontWeight = "bolder";
          });
          element.addEventListener("mouseleave", () => {
            if (email.read) {
              element.style.backgroundColor = "rgb(248,249,248)";
              element.style.color = "grey";
              element.style.fontWeight = "normal";
            } else {
              element.style.backgroundColor = "white";
              element.style.color = "black";
              element.style.fontWeight = "normal";
            }
          });
        });
      }
    });
}

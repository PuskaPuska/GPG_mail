from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models


class User(AbstractUser):
    public_key = models.TextField(blank=True)
    private_key = models.TextField(blank=True)


class Email(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="emails")
    sender = models.ForeignKey("User", on_delete=models.PROTECT, related_name="emails_sent")
    recipients = models.ManyToManyField("User", related_name="emails_received")
    subject = models.CharField(max_length=255)
    signed = models.CharField(max_length=255)
    encrypted_session_key = models.CharField(max_length=255)
    body_encrypted = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)

    def serialize(self):
        return {
            "id": self.id,
            "sender": self.sender.email,
            "recipients": [user.email for user in self.recipients.all()],
            "subject": self.subject,
            "encrypted_session_key": self.encrypted_session_key,
            "signed": self.signed,
            "body_encrypted": self.body_encrypted,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "read": self.read,
            "archived": self.archived
        }

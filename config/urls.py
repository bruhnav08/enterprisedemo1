from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # This points to your master_data app
    path('api/', include('master_data.urls')),
]
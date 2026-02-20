<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Erzwingt HTTPS-Links nur in der Produktionsumgebung
        if (config('app.env') === 'production') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
        \App\Models\User::observe(\App\Observers\UserObserver::class);
        \App\Models\Project::observe(\App\Observers\ProjectObserver::class);

        Gate::define('viewPulse', function (User $user) {
            return $user->isPlatformAdmin();
        });

        \Illuminate\Auth\Notifications\VerifyEmail::createUrlUsing(function ($notifiable) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

            $verifyUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'verification.verify',
                \Illuminate\Support\Carbon::now()->addMinutes(60),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );

            // We need to return the Frontend URL with the signature from the backend URL
            // Parse the backend generated URL to get signature and expires
            $parsed = parse_url($verifyUrl);
            parse_str($parsed['query'] ?? '', $queryParams);

            return $frontendUrl . '/verify-email?' . http_build_query([
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
                'expires' => $queryParams['expires'] ?? '',
                'signature' => $queryParams['signature'] ?? ''
            ]);
        });
    }
}
